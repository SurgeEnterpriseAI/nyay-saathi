// Durable event log in Firestore, for stateless hosts such as Cloud Run where local files vanish
// when an instance stops. Each instance replays the log into in-memory SQLite at start-up and
// appends new events here, so the impact numbers survive restarts and redeploys.
// Zero dependencies: Firestore REST API with the Cloud Run service account's token from the
// metadata server (or FIRESTORE_TOKEN, e.g. `gcloud auth print-access-token`, for local scripts).
// Stored rows are the same privacy-first rows as SQLite: hashed browser id, no text, no IPs.
import { randomBytes } from 'node:crypto';

const FIELDS = ['ts', 'day', 'sid', 'kind', 'problem_type', 'lang', 'mode', 'value', 'is_bot', 'is_internal'];
const INT_FIELDS = new Set(['is_bot', 'is_internal']);
const METADATA = 'http://metadata.google.internal/computeMetadata/v1';

export function toFirestore(row) {
  const fields = {};
  for (const f of FIELDS) {
    const v = row[f];
    fields[f] = v === null || v === undefined ? { nullValue: null } : INT_FIELDS.has(f) ? { integerValue: String(v ? 1 : 0) } : { stringValue: String(v) };
  }
  return { fields };
}

export function fromFirestore(doc) {
  const row = {};
  for (const f of FIELDS) {
    const v = doc.fields?.[f];
    row[f] = !v || 'nullValue' in v ? (INT_FIELDS.has(f) ? 0 : null) : INT_FIELDS.has(f) ? Number(v.integerValue) : v.stringValue;
  }
  return row;
}

export function createFirestoreLog({ env = process.env, fetchImpl = fetch, collection = env.FIRESTORE_COLLECTION || 'impact_events' } = {}) {
  let cached = null;
  async function token() {
    if (env.FIRESTORE_TOKEN) return env.FIRESTORE_TOKEN;
    if (cached && cached.until > Date.now()) return cached.value;
    const r = await fetchImpl(`${METADATA}/instance/service-accounts/default/token`, { headers: { 'Metadata-Flavor': 'Google' } });
    if (!r.ok) throw new Error(`metadata token ${r.status}`);
    const j = await r.json();
    cached = { value: j.access_token, until: Date.now() + (j.expires_in - 60) * 1000 };
    return cached.value;
  }
  let project = env.GOOGLE_CLOUD_PROJECT || env.FIRESTORE_PROJECT || null;
  async function projectId() {
    if (project) return project;
    const r = await fetchImpl(`${METADATA}/project/project-id`, { headers: { 'Metadata-Flavor': 'Google' } });
    if (!r.ok) throw new Error(`metadata project ${r.status}`);
    project = (await r.text()).trim();
    return project;
  }
  async function base() {
    const db = env.FIRESTORE_DATABASE || '(default)';
    return `https://firestore.googleapis.com/v1/projects/${await projectId()}/databases/${db}/documents/${collection}`;
  }
  async function call(url, init = {}) {
    const r = await fetchImpl(url, { ...init, headers: { authorization: `Bearer ${await token()}`, 'content-type': 'application/json', ...init.headers } });
    if (!r.ok) throw new Error(`firestore ${r.status}: ${(await r.text()).slice(0, 200)}`);
    return r.json();
  }

  // Document ids sort by time and are random enough to make a retried write idempotent.
  async function append(row, id = `${row.ts.replace(/[^0-9]/g, '')}-${randomBytes(6).toString('hex')}`) {
    let last;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await call(`${await base()}?documentId=${id}`, { method: 'POST', body: JSON.stringify(toFirestore(row)) });
        return true;
      } catch (err) {
        if (/firestore 409/.test(err.message)) return true; // already written by an earlier attempt
        last = err;
        await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
      }
    }
    console.error('impact event not saved:', last.message);
    return false;
  }

  async function list() {
    const rows = [];
    let pageToken = '';
    do {
      const j = await call(`${await base()}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`);
      for (const d of j.documents || []) rows.push(fromFirestore(d));
      pageToken = j.nextPageToken || '';
    } while (pageToken);
    return rows;
  }

  return { append, list };
}
