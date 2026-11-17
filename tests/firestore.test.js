import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFirestoreLog, toFirestore, fromFirestore } from '../src/firestore-log.js';
import { openStore, createApp } from '../src/server.js';

// A tiny stand-in for the metadata server and the Firestore REST API.
function fakeGoogle({ failFirst = 0 } = {}) {
  const docs = new Map();
  const calls = [];
  let failures = failFirst;
  const json = (status, body) => ({ ok: status < 300, status, json: async () => body, text: async () => JSON.stringify(body) });
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, method: init.method || 'GET', headers: init.headers || {} });
    if (url.endsWith('/service-accounts/default/token')) return json(200, { access_token: 'tok', expires_in: 3600 });
    if (url.endsWith('/project/project-id')) return { ok: true, status: 200, text: async () => 'nyay-saathi\n' };
    const m = url.match(/documents\/impact_events(?:\?(.*))?$/);
    if (!m) return json(404, { error: 'unknown url' });
    const q = new URLSearchParams(m[1] || '');
    if (init.method === 'POST') {
      if (failures > 0) { failures--; return json(503, { error: 'unavailable' }); }
      const id = q.get('documentId');
      if (docs.has(id)) return json(409, { error: 'ALREADY_EXISTS' });
      docs.set(id, { name: id, ...JSON.parse(init.body) });
      return json(200, docs.get(id));
    }
    const all = [...docs.keys()].sort();
    const start = Number(q.get('pageToken') || 0);
    const size = Number(q.get('pageSize') || 300);
    const page = all.slice(start, start + size).map((k) => docs.get(k));
    return json(200, { documents: page, ...(start + size < all.length ? { nextPageToken: String(start + size) } : {}) });
  };
  return { docs, calls, fetchImpl };
}

const env = { ANALYTICS_STORE: 'firestore', ANALYTICS_SALT: 'test-salt' };
const ua = 'Mozilla/5.0 (Linux; Android 14)';

test('rows round-trip through Firestore field encoding', () => {
  const row = { ts: '2026-11-17T10:00:00.000Z', day: '2026-11-17', sid: '0123456789abcdef', kind: 'agent_turn', problem_type: null, lang: 'te', mode: 'llm', value: null, is_bot: 0, is_internal: 1 };
  assert.deepEqual(fromFirestore(toFirestore(row)), row);
});

test('impact numbers survive a restart on a stateless host', async () => {
  const g = fakeGoogle();
  const a = await openStore(env, { fetchImpl: g.fetchImpl });
  a.record({ sid: 'browser-0001', kind: 'page_view', ua });
  a.record({ sid: 'browser-0001', kind: 'agent_turn', problem_type: 'unpaid_wages', lang: 'te', mode: 'llm', ua });
  a.record({ sid: 'browser-0002', kind: 'page_view', ua: 'Googlebot/2.1' });
  await a.flush();
  assert.equal(g.docs.size, 3);
  for (const d of g.docs.values()) assert.ok(!JSON.stringify(d).includes('browser-0001'), 'raw browser ids are never stored');

  const restarted = await openStore(env, { fetchImpl: g.fetchImpl });
  const before = a.summary();
  const after = restarted.summary();
  for (const k of ['visitors', 'people_helped', 'agent_turns', 'by_problem', 'by_language', 'excluded', 'daily']) assert.deepEqual(after[k], before[k], k);
  assert.equal(after.people_helped, 1);
  assert.equal(after.excluded.bot_events, 1);
  assert.equal(g.calls.filter((c) => c.url.includes('firestore.googleapis.com')).every((c) => c.headers.authorization === 'Bearer tok'), true);
});

test('Firestore mode needs a fixed salt', async () => {
  await assert.rejects(openStore({ ANALYTICS_STORE: 'firestore' }, { fetchImpl: fakeGoogle().fetchImpl }), /ANALYTICS_SALT/);
});

test('writes retry, stay idempotent and page through long logs', async () => {
  const g = fakeGoogle({ failFirst: 1 });
  const log = createFirestoreLog({ env: { GOOGLE_CLOUD_PROJECT: 'p' }, fetchImpl: g.fetchImpl });
  const row = { ts: '2026-11-17T10:00:00.000Z', day: '2026-11-17', sid: '0123456789abcdef', kind: 'page_view', is_bot: 0, is_internal: 0 };
  assert.equal(await log.append(row, 'fixed-id'), true, 'retried after a 503');
  assert.equal(await log.append(row, 'fixed-id'), true, 'a duplicate write counts as saved');
  assert.equal(g.docs.size, 1);
  for (let i = 0; i < 650; i++) await log.append({ ...row, ts: `2026-11-17T10:00:${String(i % 60).padStart(2, '0')}.000Z` }, `id-${String(i).padStart(4, '0')}`);
  assert.equal((await log.list()).length, 651);
});

test('the API waits for the event to be saved before answering', async () => {
  const g = fakeGoogle();
  const analytics = await openStore(env, { fetchImpl: g.fetchImpl });
  const server = createApp({ analytics, env: {} }).listen(0);
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/event`, { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': ua }, body: JSON.stringify({ sid: 'browser-0003', kind: 'page_view' }) });
    assert.equal(res.status, 204);
    assert.equal(g.docs.size, 1, 'saved before the 204 was sent');
  } finally { server.close(); }
});
