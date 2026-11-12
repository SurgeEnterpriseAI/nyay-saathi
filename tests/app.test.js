import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyOffline, PROBLEMS } from '../src/knowledge.js';
import { checkLegalAid, draftDocument, getGuidance } from '../src/tools.js';
import { agentTurn } from '../src/agent.js';
import { openAnalytics } from '../src/analytics.js';
import { createApp } from '../src/server.js';

test('offline classifier recognises common problems in English and Hindi', () => {
  assert.equal(classifyOffline('My contractor has not paid my wages for 2 months'), 'unpaid_wages');
  assert.equal(classifyOffline('ठेकेदार ने मज़दूरी नहीं दी'), 'unpaid_wages');
  assert.equal(classifyOffline('Police station refused to file my FIR'), 'police_fir');
  assert.equal(classifyOffline('my cheque bounced'), 'cheque_bounce');
  assert.equal(classifyOffline('what is the next hearing date of my court case'), 'case_status');
  assert.equal(classifyOffline('hello'), null);
  // word boundaries: "parent" must not match "rent", "first" must not match "fir"
  assert.equal(classifyOffline('my parent first'), null);
});

test('every problem has steps, sources and valid drafts', () => {
  for (const [id, p] of Object.entries(PROBLEMS)) {
    const g = getGuidance({ problem_type: id });
    assert.ok(g.steps.length >= 3, id);
    assert.ok(p.sources.length >= 1, id);
    for (const d of p.drafts) assert.ok(!draftDocument({ kind: d }).error, `${id}:${d}`);
  }
});

test('legal aid: statutory categories are eligible regardless of income', () => {
  assert.equal(checkLegalAid({ categories: ['woman'], annual_income_inr: 9_000_000 }).result, 'eligible');
  assert.equal(checkLegalAid({ categories: ['bogus'] }).result, 'need_more_info');
  assert.equal(checkLegalAid({ annual_income_inr: 80000, state: 'Telangana' }).result, 'check_with_dlsa');
  assert.equal(checkLegalAid({}).result, 'need_more_info');
});

test('drafts fill given fields, bracket the rest and report missing ones', () => {
  const d = draftDocument({ kind: 'rti', fields: { name: 'Lakshmi', bpl: 'yes', evil: 'x' } });
  assert.match(d.text, /Lakshmi/);
  assert.match(d.text, /Below Poverty Line/);
  assert.match(d.text, /\[Your address\]/);
  assert.ok(d.missing_fields.includes('address'));
  assert.ok(!d.text.includes('evil'));
  assert.ok(draftDocument({ kind: 'nope' }).error);
});

test('agent works offline with no LLM configured', async () => {
  const r = await agentTurn({ message: 'my husband beats me' }, { env: {} });
  assert.equal(r.mode, 'offline');
  assert.equal(r.problem_type, 'domestic_violence');
  assert.match(r.reply, /112/);
  const r2 = await agentTurn({ message: 'hi' }, { env: {} });
  assert.ok(r2.choices.length >= 5);
});

test('Telugu: detected from script, offline reply and steps in Telugu, same helplines', async () => {
  const r = await agentTurn({ message: 'నా భర్త నన్ను కొడతాడు' }, { env: {} });
  assert.equal(r.problem_type, 'domestic_violence');
  assert.match(r.reply, /[ఀ-౿]/);
  assert.match(r.reply, /112/);
  assert.match(r.guidance.steps[0], /[ఀ-౿]/);
  const en = getGuidance({ problem_type: 'domestic_violence', language: 'en' });
  assert.deepEqual(r.guidance.helplines, en.helplines);
  assert.deepEqual(r.guidance.sources, en.sources);
  const w = await agentTurn({ message: 'నాకు రెండు నెలల జీతం ఇవ్వలేదు' }, { env: {} });
  assert.equal(w.problem_type, 'unpaid_wages');
  const pick = await agentTurn({ message: 'సహాయం', language: 'te' }, { env: {} });
  assert.ok(pick.choices.every((c) => /[ఀ-౿]/.test(c.title)));
});

test('every problem has Telugu steps matching the English ones, with no stray scripts', () => {
  for (const [id, p] of Object.entries(PROBLEMS)) {
    assert.ok(p.title.te, `${id} te title`);
    assert.equal(p.steps.te.length, p.steps.en.length, `${id} te step count`);
    for (const s of p.steps.te) assert.doesNotMatch(s, /[ऀ-ॿঀ-৿԰-֏]/, `${id}: ${s}`);
    for (const [i, s] of p.steps.en.entries()) {
      for (const n of s.match(/\b(112|181|1098|1915|1930|15100)\b/g) || []) assert.ok(p.steps.te[i].includes(n), `${id} step ${i} keeps ${n}`);
    }
  }
});

test('agent runs an LLM tool loop and keeps tool output verbatim', async () => {
  const calls = [];
  const fakeFetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    calls.push(body);
    const step = calls.length;
    const msg = step === 1
      ? { role: 'assistant', content: '', tool_calls: [
          { id: 'a', type: 'function', function: { name: 'get_guidance', arguments: '{"problem_type":"consumer"}' } },
          { id: 'b', type: 'function', function: { name: 'draft_document', arguments: '{"kind":"consumer_complaint","fields":{"amount_inr":"4999"}}' } },
        ] }
      : { role: 'assistant', content: 'Start by writing to the seller.' };
    return { ok: true, json: async () => ({ choices: [{ message: msg }] }) };
  };
  const r = await agentTurn({ message: 'phone stopped working, shop refuses refund' }, { env: { LLM_BASE_URL: 'http://x/v1', LLM_MODEL: 'm' }, fetchImpl: fakeFetch });
  assert.equal(r.mode, 'llm');
  assert.deepEqual(r.tool_calls, ['get_guidance', 'draft_document']);
  assert.equal(r.problem_type, 'consumer');
  assert.match(r.drafts[0].text, /4999/);
  assert.equal(r.reply, 'Start by writing to the seller.');
  assert.equal(calls[1].messages.at(-1).role, 'tool');
});

test('agent falls back to offline when the LLM fails', async () => {
  const r = await agentTurn({ message: 'cheque bounced' }, { env: { LLM_BASE_URL: 'http://x/v1', LLM_MODEL: 'm' }, fetchImpl: async () => ({ ok: false, status: 503 }) });
  assert.equal(r.mode, 'offline_fallback');
  assert.equal(r.problem_type, 'cheque_bounce');
});

test('analytics stores no free text, flags bots and internal use', () => {
  const a = openAnalytics(':memory:');
  const ua = 'Mozilla/5.0 (Linux; Android 14)';
  assert.ok(a.record({ sid: 'abcdefgh1', kind: 'page_view', ua }));
  assert.ok(a.record({ sid: 'abcdefgh1', kind: 'agent_turn', problem_type: 'consumer', lang: 'hi', mode: 'offline', ua }));
  assert.ok(a.record({ sid: 'abcdefgh2', kind: 'agent_turn', problem_type: 'consumer', ua: 'Googlebot/2.1' }));
  assert.ok(a.record({ sid: 'abcdefgh3', kind: 'agent_turn', ua, internal: true }));
  assert.equal(a.record({ sid: 'abcdefgh1', kind: 'feedback', value: 'my phone is 98xxxx', ua }), false);
  assert.equal(a.record({ sid: 'bad', kind: 'page_view', ua }), false);
  assert.equal(a.recordClient({ sid: 'abcdefgh1', kind: 'agent_turn' }, { ua }), false, 'clients cannot fake agent turns');
  assert.ok(a.recordClient({ sid: 'abcdefgh1', kind: 'feedback', value: 'helpful' }, { ua }));
  const s = a.summary();
  assert.equal(s.people_helped, 1);
  assert.equal(s.visitors, 1);
  assert.deepEqual(s.by_problem, { consumer: 1 });
  assert.equal(s.feedback.helpful, 1);
  assert.equal(s.excluded.bot_events, 1);
  assert.equal(s.excluded.internal_events, 1);
  assert.match(a.dailyCsv(), /^day,kind,events,sessions/);
});

test('HTTP API end to end', async () => {
  const analytics = openAnalytics(':memory:');
  const server = createApp({ analytics, env: {} }).listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const headers = { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 test-browser' };
  try {
    const chat = await (await fetch(`${base}/api/chat`, { method: 'POST', headers, body: JSON.stringify({ sid: 'session-1234', message: 'employer did not pay salary' }) })).json();
    assert.equal(chat.problem_type, 'unpaid_wages');
    const aid = await (await fetch(`${base}/api/aid`, { method: 'POST', headers, body: JSON.stringify({ sid: 'session-1234', categories: ['industrial_worker'] }) })).json();
    assert.equal(aid.result, 'eligible');
    const ev = await fetch(`${base}/api/event`, { method: 'POST', headers, body: JSON.stringify({ sid: 'session-1234', kind: 'helpline_tapped', value: '15100' }) });
    assert.equal(ev.status, 204);
    const imp = await (await fetch(`${base}/api/impact`)).json();
    assert.equal(imp.people_helped, 1);
    assert.equal(imp.helpline_taps, 1);
    assert.equal(imp.drafts_made, 1);
    const page = await fetch(`${base}/`);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-security-policy'), /default-src 'self'/);
    assert.equal((await fetch(`${base}/../package.json`)).status, 404);
    const big = await fetch(`${base}/api/chat`, { method: 'POST', headers, body: JSON.stringify({ message: 'x'.repeat(20000) }) });
    assert.equal(big.status, 413);
  } finally { server.close(); }
});

test('stripThinking keeps only the answer after a leaked </think>', async () => {
  const { stripThinking } = await import('../src/agent.js');
  assert.equal(stripThinking('We need answer... Good.\n</think>\n\nA consumer court is a forum.'), 'A consumer court is a forum.');
  assert.equal(stripThinking('<think>half a thought'), '');
  assert.equal(stripThinking('Plain answer.'), 'Plain answer.');
});

test('extraBody parses LLM_EXTRA_BODY and ignores bad JSON', async () => {
  const { extraBody } = await import('../src/agent.js');
  assert.deepEqual(extraBody({ LLM_EXTRA_BODY: '{"chat_template_kwargs":{"enable_thinking":false}}' }), { chat_template_kwargs: { enable_thinking: false } });
  assert.deepEqual(extraBody({ LLM_EXTRA_BODY: '{bad' }), {});
  assert.deepEqual(extraBody({}), {});
});

test('replies are plain text and never show a helpline number no tool returned', async () => {
  const { plainText, unverifiedNumbers } = await import('../src/agent.js');
  assert.equal(plainText('Call **15100** now.\n## Steps'), 'Call 15100 now.\nSteps');
  assert.deepEqual(unverifiedNumbers('Call 181 or 1091.', '{"number":"181"}'), ['1091']);
  assert.deepEqual(unverifiedNumbers('You are owed ₹1500 and 1200 rupees since 2026.', ''), []);
  const replies = ['', 'మీరు 1091కి కాల్ చేయండి. **181** (పోలీసు)'];
  const fakeFetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    const msg = body.messages.at(-1).role === 'tool'
      ? { role: 'assistant', content: replies[1] }
      : { role: 'assistant', content: '', tool_calls: [{ id: 'a', type: 'function', function: { name: 'get_guidance', arguments: '{"problem_type":"domestic_violence","language":"te"}' } }] };
    return { ok: true, json: async () => ({ choices: [{ message: msg }] }) };
  };
  const r = await agentTurn({ message: 'నా భర్త నన్ను కొడతాడు' }, { env: { LLM_BASE_URL: 'http://x/v1', LLM_MODEL: 'm' }, fetchImpl: fakeFetch });
  assert.deepEqual(r.reply_replaced, ['1091']);
  assert.doesNotMatch(r.reply, /1091|\*\*/);
  assert.match(r.reply, /112/);
  assert.match(r.reply, /[ఀ-౿]/);
});

test('guide pages are served as crawlable HTML with canonical, JSON-LD and only known helplines', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const { HELPLINES } = await import('../src/knowledge.js');
  const known = new Set(Object.values(HELPLINES).map((h) => h.number));
  const slugs = readdirSync(new URL('../public/guides/', import.meta.url)).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5));
  assert.ok(slugs.length >= 4);
  const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  const llms = readFileSync(new URL('../public/llms.txt', import.meta.url), 'utf8');
  const home = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(home, /href="\/guides\/free-legal-help-websites-india"/);
  const server = createApp({ analytics: openAnalytics(':memory:'), env: {} }).listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const slug of slugs) {
      const url = `https://nyaysaathi.surgesoftware.co.in/guides/${slug}`;
      assert.ok(sitemap.includes(`<loc>${url}</loc>`), `sitemap lists ${slug}`);
      assert.ok(llms.includes(url), `llms.txt lists ${slug}`);
      const r = await fetch(`${base}/guides/${slug}`);
      assert.equal(r.status, 200);
      assert.match(r.headers.get('content-type'), /text\/html/);
      const html = await r.text();
      assert.ok(html.includes(`<link rel="canonical" href="${url}">`));
      assert.match(html, /<title>[^<]+<\/title>/);
      assert.match(html, /<meta name="description" content="[^"]{50,}">/);
      const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
      const types = ld['@graph'].map((n) => n['@type']);
      assert.ok(types.includes('FAQPage') && types.includes('WebPage'));
      for (const [, n] of html.matchAll(/href="tel:(\d+)"/g)) assert.ok(known.has(n), `unknown helpline ${n} on ${slug}`);
    }
    assert.equal((await fetch(`${base}/guides/../package`)).status, 404);
    assert.equal((await fetch(`${base}/guides/nope`)).status, 404);
  } finally { server.close(); }
});
