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
