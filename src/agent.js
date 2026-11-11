// The agent: plans with an LLM (any OpenAI-compatible endpoint, including a local
// Ollama/vLLM server) and acts through deterministic tools. If no LLM is configured or
// the LLM fails, an offline planner runs the same tools so the app always works.
import { PROBLEMS, DISCLAIMER, classifyOffline } from './knowledge.js';
import { TOOL_SCHEMAS, TOOL_IMPLS, getGuidance } from './tools.js';

const MAX_STEPS = 5;

const SYSTEM_PROMPT = `You are Nyay Saathi, a free legal-help guide for ordinary people in India, many of whom have little schooling.
Your job: understand the person's problem, then use tools to give verified next steps, check free legal aid eligibility, and prepare draft letters.
Rules:
- Always call get_guidance before giving steps. Never state a law, deadline, fee or helpline that a tool did not return.
- If the person may be in danger, tell them to call 112 first.
- Women, children, SC/ST, persons with disability and workers usually get a free lawyer: call check_legal_aid when relevant.
- Offer a draft with draft_document when one is available. Pass only facts the person gave.
- Reply in the person's language (Hindi if they write in Hindi or Hinglish, Telugu if they write in Telugu). Use short, plain sentences. At most 6 sentences; the app shows steps and drafts separately, so do not repeat them in full.
- Mention a helpline only with the exact number and name a tool returned.
- Plain text only: no Markdown (no **, #, or tables).
- You give legal information, not legal advice. Do not guess outcomes of cases.`;

// The app shows replies as plain text, so drop Markdown emphasis and headings the model may still add.
export function plainText(text) {
  return String(text || '')
    .replace(/\*\*(.+?)\*\*/gs, '$1').replace(/__(.+?)__/gs, '$1').replace(/`([^`]*)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '').replace(/\*\*/g, '').trim();
}

// Short codes like 1091 or 100 that look like Indian helplines. Money (₹1500, 1500 rupees) is not a helpline.
const SHORT_CODE = /(?<![\d₹.,/-])(?<!Rs\.? ?)(?<!INR ?)\b1\d{2,4}\b(?![\d,/-]|\.\d)(?! ?(?:rupees|rs\b|रुपये|రూపాయ))/giu;

// Guard: every helpline-like number in the reply must come from a tool result or from the person.
export function unverifiedNumbers(reply, allowedText) {
  const allowed = new Set(String(allowedText).match(/\d+/g) || []);
  return [...String(reply).matchAll(SHORT_CODE)].map((m) => m[0]).filter((n) => !allowed.has(n));
}

export function llmConfigured(env = process.env) {
  return Boolean(env.LLM_BASE_URL && env.LLM_MODEL);
}

// Optional extra request fields as JSON, e.g. LLM_EXTRA_BODY={"chat_template_kwargs":{"enable_thinking":false}}
// for Qwen-style models served by vLLM. Invalid JSON is ignored.
export function extraBody(env = process.env) {
  if (!env.LLM_EXTRA_BODY) return {};
  try {
    const v = JSON.parse(env.LLM_EXTRA_BODY);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

// Reasoning models sometimes leak their thinking before a closing </think> tag: keep only the answer.
export function stripThinking(text) {
  const i = text.lastIndexOf('</think>');
  return (i >= 0 ? text.slice(i + '</think>'.length) : text.replace(/<think>[\s\S]*$/, '')).trim();
}

async function callLLM(messages, env, fetchImpl) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), Number(env.LLM_TIMEOUT_MS || 30000));
  try {
    const res = await fetchImpl(`${env.LLM_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(env.LLM_API_KEY ? { authorization: `Bearer ${env.LLM_API_KEY}` } : {}),
      },
      body: JSON.stringify({ model: env.LLM_MODEL, messages, tools: TOOL_SCHEMAS, tool_choice: 'auto', temperature: 0.2, max_tokens: 700, ...extraBody(env) }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const json = await res.json();
    const msg = json?.choices?.[0]?.message;
    if (!msg) throw new Error('LLM returned no message');
    if (typeof msg.content === 'string') msg.content = stripThinking(msg.content);
    return msg;
  } finally {
    clearTimeout(timer);
  }
}

function detectLanguage(text) {
  // Detect Devanagari (Hindi) or Telugu script ranges. Telugu: U+0C00–U+0C7F
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  if (/[ऀ-ॿ]/.test(text)) return 'hi';
  return 'en';
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
}

function runTool(name, args, out) {
  const impl = TOOL_IMPLS[name];
  if (!impl) return { error: `unknown tool ${name}` };
  const result = impl(args || {});
  out.tool_calls.push(name);
  if (name === 'get_guidance' && !result.error) { out.guidance = result; out.problem_type = result.problem_type; }
  if (name === 'check_legal_aid') out.eligibility = result;
  if (name === 'draft_document' && !result.error) out.drafts.push(result);
  return result;
}

export function offlineTurn(message, language, preferredType) {
  const out = { mode: 'offline', tool_calls: [], drafts: [], guidance: null, eligibility: null, problem_type: null };
  const type = (preferredType && PROBLEMS[preferredType] ? preferredType : null) || classifyOffline(message);
  if (!type) {
    out.reply = language === 'hi' ?
      'मैं आपकी मदद करना चाहता हूँ। नीचे से अपनी समस्या चुनें, या एक-दो वाक्य में बताएँ कि क्या हुआ।' :
      language === 'te' ?
        'నేను మీకు సహాయం చేయాలనుకుంటున్నాను. క్రింద మీ సమస్యకు దగ్గరైనది ఎంచుకోండి, లేదా ఒకటి-రెండు వాక్యాలలో ఏమి జరిగినదో చెప్పండి.' :
        'I want to help. Pick the problem closest to yours below, or tell me in one or two sentences what happened.';
    out.choices = Object.entries(PROBLEMS).map(([id, p]) => ({ id, title: p.title[language] || p.title.en }));
    return out;
  }
  const g = runTool('get_guidance', { problem_type: type, language }, out);
  for (const kind of g.drafts_available.slice(0, 1)) runTool('draft_document', { kind, fields: {} }, out);
  const urgent = g.urgent ? (language === 'hi' ? 'अगर आप अभी ख़तरे में हैं, तुरंत 112 पर कॉल करें। ' : language === 'te' ? 'మీకు ఇప్పుడే ప్రమాదం ఉంటే, వెంటనే 112కి కాల్ చేయండి. ' : 'If you are in danger right now, call 112. ') : '';
  out.reply = language === 'hi'
    ? `${urgent}यह "${g.title}" जैसा मामला लगता है। नीचे आगे के कदम, हेल्पलाइन और एक ड्राफ़्ट पत्र है। ${DISCLAIMER.hi}`
    : language === 'te' ?
      `${urgent}ఇది "${g.title}" సమస్యలా ఉంది. కింద తదుపరి అడుగులు, హెల్ప్‌లైన్‌లు, మీరు నింపుకోగల ఒక డ్రాఫ్ట్ లేఖ ఉన్నాయి. ${DISCLAIMER.te || DISCLAIMER.en}` :
      `${urgent}This sounds like: ${g.title}. Below are your next steps, helplines and a draft letter you can fill in. ${DISCLAIMER.en}`;
  return out;
}

export async function agentTurn({ message, history = [], language, problem_type }, { env = process.env, fetchImpl = fetch } = {}) {
  const text = String(message || '').slice(0, 2000);
  // The script the person actually typed in wins; otherwise use the app's language setting.
  const detected = detectLanguage(text);
  const lang = detected !== 'en' ? detected : (['en', 'hi', 'te'].includes(language) ? language : 'en');
  if (!llmConfigured(env)) return offlineTurn(text, lang, problem_type);

  const out = { mode: 'llm', tool_calls: [], drafts: [], guidance: null, eligibility: null, problem_type: null };
  const messages = [
    { role: 'system', content: `${SYSTEM_PROMPT}\nPreferred language code: ${lang}.` },
    ...sanitizeHistory(history),
    { role: 'user', content: problem_type && PROBLEMS[problem_type] ? `${text}\n(Problem type chosen: ${problem_type})` : text },
  ];
  try {
    for (let step = 0; step < MAX_STEPS; step++) {
      const msg = await callLLM(messages, env, fetchImpl);
      const calls = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
      if (!calls.length) {
        out.reply = String(msg.content || '').trim();
        break;
      }
      messages.push({ role: 'assistant', content: msg.content || '', tool_calls: calls });
      for (const c of calls) {
        let args = {};
        try { args = JSON.parse(c.function?.arguments || '{}'); } catch { args = {}; }
        const result = runTool(c.function?.name, args, out);
        messages.push({ role: 'tool', tool_call_id: c.id, content: JSON.stringify(result) });
      }
    }
    out.reply = plainText(out.reply);
    if (!out.reply) out.reply = out.guidance ? `${out.guidance.title}: see the steps below.` : 'Please tell me a little more about what happened.';
    // Guard: if the model answered without grounding, attach verified guidance ourselves.
    if (!out.guidance) {
      const type = classifyOffline(text);
      if (type) runTool('get_guidance', { problem_type: type, language: lang }, out);
    }
    // Guard: a helpline number no tool returned is never shown; use the verified offline reply instead.
    const grounded = [text, ...messages.filter((m) => m.role === 'tool').map((m) => m.content), JSON.stringify(out.guidance || {}), JSON.stringify(out.eligibility || {})].join(' ');
    const bad = unverifiedNumbers(out.reply, grounded);
    if (bad.length) {
      out.reply = offlineTurn(text, lang, out.problem_type || problem_type).reply;
      out.reply_replaced = bad.slice(0, 3);
    }
    return out;
  } catch (err) {
    const fallback = offlineTurn(text, lang, problem_type);
    fallback.mode = 'offline_fallback';
    fallback.fallback_reason = String(err.message || err).slice(0, 80);
    return fallback;
  }
}

export { getGuidance };
