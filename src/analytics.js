// Privacy-first usage analytics, built to produce honest deployment evidence.
// Stored: event kind, day, coarse category (problem type, language, mode) and a salted
// hash of a random browser id. NOT stored: message text, names, phone numbers, IP
// addresses or exact user agents. Bot and internal/test traffic is flagged, not deleted,
// so the public numbers can show both raw and filtered counts.
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { PROBLEMS } from './knowledge.js';

export const EVENT_KINDS = new Set([
  'page_view', 'agent_turn', 'aid_checked', 'draft_made', 'draft_copied', 'draft_downloaded',
  'helpline_tapped', 'feedback', 'followup',
]);
const CLIENT_KINDS = new Set(['page_view', 'draft_copied', 'draft_downloaded', 'helpline_tapped', 'feedback', 'followup']);
const VALUES = {
  feedback: new Set(['helpful', 'not_helpful']),
  followup: new Set(['took_step', 'not_yet', 'resolved']),
  helpline_tapped: new Set(['15100', '112', '181', '1098', '1915', '1930']),
};
const BOT_UA = /bot|crawl|spider|slurp|preview|headless|python-requests|curl|wget|httpclient|axios|go-http|java\/|phantom|lighthouse|monitor|uptime/i;

export function isBotUA(ua) {
  return !ua || BOT_UA.test(ua);
}

function loadSalt(dbPath) {
  if (process.env.ANALYTICS_SALT) return process.env.ANALYTICS_SALT;
  if (dbPath === ':memory:') return randomBytes(16).toString('hex');
  const f = join(dirname(dbPath), '.analytics-salt');
  if (existsSync(f)) return readFileSync(f, 'utf8').trim();
  const s = randomBytes(16).toString('hex');
  writeFileSync(f, s, { mode: 0o600 });
  return s;
}

// `sink` (optional) receives every stored row, e.g. a Firestore log on Cloud Run. Its writes are
// tracked so the server can `await flush()` before answering: Cloud Run throttles CPU after the
// response, so a write left running in the background might never finish.
export function openAnalytics(dbPath = process.env.ANALYTICS_DB || './data/analytics.db', { sink } = {}) {
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    ts TEXT NOT NULL,
    day TEXT NOT NULL,
    sid TEXT NOT NULL,
    kind TEXT NOT NULL,
    problem_type TEXT,
    lang TEXT,
    mode TEXT,
    value TEXT,
    is_bot INTEGER NOT NULL DEFAULT 0,
    is_internal INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS events_day ON events(day);
  CREATE INDEX IF NOT EXISTS events_kind ON events(kind);`);
  const salt = loadSalt(dbPath);
  const insert = db.prepare('INSERT INTO events (ts, day, sid, kind, problem_type, lang, mode, value, is_bot, is_internal) VALUES (?,?,?,?,?,?,?,?,?,?)');

  const hashSid = (sid) => createHash('sha256').update(`${salt}:${sid}`).digest('hex').slice(0, 16);

  function record({ sid, kind, problem_type, lang, mode, value, ua, internal, now = new Date() }) {
    if (!EVENT_KINDS.has(kind)) return false;
    if (typeof sid !== 'string' || !/^[a-zA-Z0-9-]{8,64}$/.test(sid)) return false;
    const pt = problem_type && PROBLEMS[problem_type] ? problem_type : null;
    const lg = lang === 'hi' || lang === 'en' || lang === 'te' ? lang : null;
    const md = typeof mode === 'string' && /^[a-z_]{1,20}$/.test(mode) ? mode : null;
    let val = null;
    if (VALUES[kind]) { if (!VALUES[kind].has(value)) return false; val = value; }
    else if (typeof value === 'string' && /^[a-z_]{1,24}$/.test(value)) val = value;
    const ts = now.toISOString();
    const row = { ts, day: ts.slice(0, 10), sid: hashSid(sid), kind, problem_type: pt, lang: lg, mode: md, value: val, is_bot: isBotUA(ua) ? 1 : 0, is_internal: internal ? 1 : 0 };
    insertRow(row);
    if (sink) {
      const p = Promise.resolve().then(() => sink(row)).catch((err) => console.error('analytics sink:', err.message));
      pending.add(p);
      p.finally(() => pending.delete(p));
    }
    return true;
  }

  const pending = new Set();
  const insertRow = (r) => insert.run(r.ts, r.day, r.sid, r.kind, r.problem_type ?? null, r.lang ?? null, r.mode ?? null, r.value ?? null, r.is_bot ? 1 : 0, r.is_internal ? 1 : 0);

  // Replays already-hashed rows (from a durable log or an export). Rows that don't look like ours are skipped.
  function load(rows) {
    let n = 0;
    db.exec('BEGIN');
    try {
      for (const r of rows) {
        if (!r || !EVENT_KINDS.has(r.kind) || typeof r.ts !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.day || '') || !/^[0-9a-f]{16}$/.test(r.sid || '')) continue;
        insertRow(r);
        n++;
      }
      db.exec('COMMIT');
    } catch (err) { db.exec('ROLLBACK'); throw err; }
    return n;
  }

  const flush = () => Promise.all([...pending]);
  const rows = () => db.prepare('SELECT ts, day, sid, kind, problem_type, lang, mode, value, is_bot, is_internal FROM events ORDER BY id').all();

  function recordClient(evt, ctx) {
    if (!evt || !CLIENT_KINDS.has(evt.kind)) return false;
    return record({ ...evt, ...ctx });
  }

  function summary({ days = 30 } = {}) {
    const real = 'is_bot = 0 AND is_internal = 0';
    const one = (sql, ...p) => db.prepare(sql).get(...p);
    const all = (sql, ...p) => db.prepare(sql).all(...p);
    const count = (kind) => one(`SELECT COUNT(*) n FROM events WHERE ${real} AND kind = ?`, kind).n;
    const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const helpful = count('feedback') ? one(`SELECT SUM(value='helpful') y, COUNT(*) n FROM events WHERE ${real} AND kind='feedback'`) : { y: 0, n: 0 };
    return {
      generated_at: new Date().toISOString(),
      first_event_day: one(`SELECT MIN(day) d FROM events WHERE ${real}`).d,
      visitors: one(`SELECT COUNT(DISTINCT sid) n FROM events WHERE ${real} AND kind='page_view'`).n,
      people_helped: one(`SELECT COUNT(DISTINCT sid) n FROM events WHERE ${real} AND kind='agent_turn'`).n,
      agent_turns: count('agent_turn'),
      aid_checks: count('aid_checked'),
      drafts_made: count('draft_made'),
      drafts_taken: one(`SELECT COUNT(*) n FROM events WHERE ${real} AND kind IN ('draft_copied','draft_downloaded')`).n,
      helpline_taps: count('helpline_tapped'),
      feedback: { helpful: helpful.y || 0, total: helpful.n || 0 },
      followups: Object.fromEntries(all(`SELECT value, COUNT(*) n FROM events WHERE ${real} AND kind='followup' GROUP BY value`).map((r) => [r.value, r.n])),
      by_problem: Object.fromEntries(all(`SELECT problem_type, COUNT(DISTINCT sid) n FROM events WHERE ${real} AND kind='agent_turn' AND problem_type IS NOT NULL GROUP BY problem_type ORDER BY n DESC`).map((r) => [r.problem_type, r.n])),
      by_language: Object.fromEntries(all(`SELECT lang, COUNT(*) n FROM events WHERE ${real} AND kind='agent_turn' AND lang IS NOT NULL GROUP BY lang`).map((r) => [r.lang, r.n])),
      by_mode: Object.fromEntries(all(`SELECT mode, COUNT(*) n FROM events WHERE ${real} AND kind='agent_turn' AND mode IS NOT NULL GROUP BY mode`).map((r) => [r.mode, r.n])),
      daily: all(`SELECT day, COUNT(DISTINCT CASE WHEN kind='page_view' THEN sid END) visitors, COUNT(DISTINCT CASE WHEN kind='agent_turn' THEN sid END) helped, SUM(kind='agent_turn') turns FROM events WHERE ${real} AND day >= ? GROUP BY day ORDER BY day`, since),
      excluded: {
        bot_events: one('SELECT COUNT(*) n FROM events WHERE is_bot = 1').n,
        internal_events: one('SELECT COUNT(*) n FROM events WHERE is_internal = 1 AND is_bot = 0').n,
      },
    };
  }

  function dailyCsv() {
    const rows = db.prepare(`SELECT day, kind, COUNT(*) events, COUNT(DISTINCT sid) sessions FROM events WHERE is_bot = 0 AND is_internal = 0 GROUP BY day, kind ORDER BY day, kind`).all();
    return ['day,kind,events,sessions', ...rows.map((r) => `${r.day},${r.kind},${r.events},${r.sessions}`)].join('\n') + '\n';
  }

  return { record, recordClient, summary, dailyCsv, load, flush, rows, close: () => db.close() };
}
