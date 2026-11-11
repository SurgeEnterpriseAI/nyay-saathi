// Zero-dependency HTTP server (Node.js 22.5+). Run: node src/server.js
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { agentTurn, llmConfigured } from './agent.js';
import { checkLegalAid, draftDocument, DRAFT_KINDS, AID_CATEGORIES } from './tools.js';
import { PROBLEMS, HELPLINES } from './knowledge.js';
import { openAnalytics } from './analytics.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8' };
const SECURITY_HEADERS = {
  'content-security-policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
};

// Small in-memory rate limiter (per IP, never persisted) to protect a free LLM quota.
function rateLimiter(limit, windowMs) {
  const hits = new Map();
  return (key) => {
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= limit) { hits.set(key, arr); return false; }
    arr.push(now);
    hits.set(key, arr);
    if (hits.size > 10000) hits.clear();
    return true;
  };
}

function send(res, status, body, headers = {}) {
  const isStr = typeof body === 'string' || Buffer.isBuffer(body);
  res.writeHead(status, { ...SECURITY_HEADERS, 'content-type': isStr ? 'text/plain; charset=utf-8' : 'application/json', ...headers });
  res.end(isStr ? body : JSON.stringify(body));
}

async function readJson(req, max = 16384) {
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > max) throw Object.assign(new Error('too large'), { status: 413 });
    chunks.push(c);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { throw Object.assign(new Error('bad json'), { status: 400 }); }
}

export function createApp({ analytics = openAnalytics(), env = process.env, fetchImpl = fetch } = {}) {
  const chatLimit = rateLimiter(Number(env.CHAT_LIMIT_PER_10MIN || 30), 10 * 60 * 1000);
  const ipOf = (req) => (env.TRUST_PROXY ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() : '') || req.socket.remoteAddress || 'x';
  const ctx = (req, body) => ({ ua: req.headers['user-agent'] || '', internal: body?.internal === true });

  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://local');
      const p = url.pathname;

      if (req.method === 'GET' && p === '/healthz') return send(res, 200, { ok: true, llm: llmConfigured(env) });

      if (req.method === 'GET' && p === '/api/config') {
        return send(res, 200, {
          llm: llmConfigured(env),
          problems: Object.fromEntries(Object.entries(PROBLEMS).map(([id, v]) => [id, { title: v.title, drafts: v.drafts }])),
          drafts: Object.fromEntries(Object.entries(DRAFT_KINDS).map(([id, d]) => [id, { title: d.title, fields: d.fields }])),
          aid_categories: AID_CATEGORIES,
          helplines: HELPLINES,
        });
      }

      if (req.method === 'POST' && p === '/api/chat') {
        if (!chatLimit(ipOf(req))) return send(res, 429, { error: 'Too many messages. Please wait a few minutes, or call 15100 for free legal aid.' });
        const body = await readJson(req);
        if (!String(body.message || '').trim() && !body.problem_type) return send(res, 400, { error: 'message required' });
        const out = await agentTurn(body, { env, fetchImpl });
        const c = ctx(req, body);
        const base = { sid: body.sid, problem_type: out.problem_type, ...c };
        const msg = String(body.message || '');
        const lang = body.language === 'te' || /[ఀ-౿]/.test(msg) ? 'te' : body.language === 'hi' || /[ऀ-ॿ]/.test(msg) ? 'hi' : 'en';
        analytics.record({ ...base, kind: 'agent_turn', lang, mode: out.mode });
        for (const d of out.drafts) analytics.record({ ...base, kind: 'draft_made', lang, value: d.kind });
        if (out.eligibility) analytics.record({ ...base, kind: 'aid_checked', lang, value: out.eligibility.result });
        return send(res, 200, out);
      }

      if (req.method === 'POST' && p === '/api/aid') {
        const body = await readJson(req);
        const out = checkLegalAid(body);
        analytics.record({ sid: body.sid, kind: 'aid_checked', value: out.result, lang: body.language, ...ctx(req, body) });
        return send(res, 200, out);
      }

      if (req.method === 'POST' && p === '/api/draft') {
        const body = await readJson(req);
        const out = draftDocument(body);
        if (!out.error) analytics.record({ sid: body.sid, kind: 'draft_made', value: out.kind, problem_type: body.problem_type, lang: body.language, ...ctx(req, body) });
        return send(res, out.error ? 400 : 200, out);
      }

      if (req.method === 'POST' && p === '/api/event') {
        const body = await readJson(req, 2048);
        const ok = analytics.recordClient(body, ctx(req, body));
        return send(res, ok ? 204 : 400, ok ? '' : { error: 'invalid event' });
      }

      if (req.method === 'GET' && p === '/api/impact') return send(res, 200, analytics.summary(), { 'cache-control': 'public, max-age=60' });
      if (req.method === 'GET' && p === '/api/impact.csv') return send(res, 200, analytics.dailyCsv(), { 'content-type': 'text/csv; charset=utf-8' });

      if (req.method === 'GET' || req.method === 'HEAD') {
        const rel = p === '/' ? '/index.html' : p === '/impact' ? '/impact.html' : p;
        const file = normalize(join(ROOT, rel));
        if (!file.startsWith(ROOT)) return send(res, 404, 'not found');
        try {
          const data = await readFile(file);
          return send(res, 200, data, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'public, max-age=300' });
        } catch { return send(res, 404, 'not found'); }
      }
      return send(res, 405, 'method not allowed');
    } catch (err) {
      return send(res, err.status || 500, { error: err.status ? err.message : 'server error' });
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('server.js')) {
  const port = Number(process.env.PORT || 8080);
  createApp().listen(port, () => console.log(`Nyay Saathi on http://localhost:${port} (LLM: ${llmConfigured() ? process.env.LLM_MODEL : 'offline mode'})`));
}
