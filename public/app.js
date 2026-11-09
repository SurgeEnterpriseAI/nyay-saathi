// Nyay Saathi front end. No framework, no third-party scripts, no cookies.
const $ = (s) => document.querySelector(s);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

const T = {
  en: {},
  hi: {
    nav_impact: 'प्रभाव', hero_title: 'कानूनी परेशानी में हैं? अगला कदम जानें, मुफ़्त।',
    hero_sub: 'अपने शब्दों में बताएँ क्या हुआ। आपको साफ़ कदम, सही हेल्पलाइन, मुफ़्त वकील मिलेगा या नहीं, और भरने लायक पत्र मिलेगा।',
    sos: 'अभी ख़तरे में हैं?', free_lawyer: 'मुफ़्त वकील:', ask_label: 'अपनी समस्या लिखें',
    ask_ph: 'उदाहरण: ठेकेदार ने 2 महीने की मज़दूरी नहीं दी', send: 'मदद पाएँ',
    privacy_note: 'आप जो लिखते हैं, हम सेव नहीं करते। कोई साइन-अप नहीं। हम केवल गुमनाम गिनती रखते हैं।',
    aid_title: 'क्या मुझे मुफ़्त वकील मिल सकता है?', aid_sub: 'विधिक सेवा प्राधिकरण अधिनियम, 1987 की धारा 12 के तहत कई लोगों को मुफ़्त कानूनी सहायता मिलती है। जो लागू हो, चुनें।',
    income: 'सालाना पारिवारिक आय (₹), अगर ऊपर कुछ लागू नहीं', state: 'राज्य', check: 'जाँचें',
    fb_q: 'क्या यह मददगार था?', yes: 'हाँ', no: 'नहीं', thanks: 'धन्यवाद!',
    fu_q: 'फिर से स्वागत है। पिछली बार आपने मदद खोजी थी। क्या आपने अगला कदम उठाया?',
    fu_yes: 'हाँ, उठाया', fu_resolved: 'समस्या हल हो गई', fu_no: 'अभी नहीं',
    disclaimer: 'यह सामान्य कानूनी जानकारी है, कानूनी सलाह नहीं। अपने मामले के लिए वकील से बात करें। मुफ़्त वकील के लिए 15100 पर कॉल करें।',
    oss: 'ओपन सोर्स (MIT)।', steps: 'आगे के कदम', helplines: 'हेल्पलाइन', sources: 'आधिकारिक स्रोत',
    draft: 'ड्राफ़्ट पत्र', make_draft: 'पत्र बनाएँ', copy: 'कॉपी करें', download: 'डाउनलोड', copied: 'कॉपी हो गया',
    thinking: 'सोच रहा हूँ…', you: 'आप', error: 'कुछ गड़बड़ हुई। फिर कोशिश करें, या 15100 पर कॉल करें।',
    fill_note: 'जो पता है वह भरें; बाकी [ब्रैकेट] में रहेगा। हस्ताक्षर से पहले जाँच लें।',
  },
};
const CAT_HI = { sc_st: 'अनुसूचित जाति / जनजाति', trafficking: 'मानव तस्करी या बेगार का शिकार', woman: 'महिला', child: 'बच्चा (18 से कम)', disability: 'दिव्यांग व्यक्ति', disaster: 'आपदा, जातीय हिंसा या अत्याचार का शिकार', industrial_worker: 'औद्योगिक कामगार', custody: 'हिरासत में व्यक्ति' };
const FIELD_LABELS = {
  name: 'Your full name', address: 'Your address', phone: 'Phone', district: 'District', state: 'State',
  category_or_income: 'Why you are eligible (e.g. I am a woman)', problem_summary: 'What happened (short)',
  office_name: 'Office / department', office_address: 'Office address', information_sought: 'Information you want',
  bpl: 'Below poverty line? (yes/no)', seller_name: 'Seller / company', seller_address: 'Seller address or email',
  purchase_date: 'Date of purchase', amount_inr: 'Amount (₹)', relief_sought: 'What you want (refund, replacement…)',
  employer_name: 'Employer / contractor', employer_address: 'Employer address', work_period: 'Period you worked',
  police_station: 'Police station', incident_date: 'Date of incident', incident_summary: 'What happened', date_approached: 'Date you went to the police',
};

let lang = store.get('ns_lang') || ((navigator.language || '').startsWith('hi') ? 'hi' : 'en');
let config = null;
let current = { problem_type: null };
const history = [];
const t = (k, fallback) => (T[lang] && T[lang][k]) || fallback || k;

function sid() {
  let id = store.get('ns_sid');
  if (!id) { id = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now(); store.set('ns_sid', id); }
  return id;
}
// Visit with ?internal=1 once on a device to mark your own testing as internal (excluded from impact numbers).
if (new URLSearchParams(location.search).get('internal') === '1') store.set('ns_internal', '1');
if (new URLSearchParams(location.search).get('internal') === '0') store.set('ns_internal', '0');
const internal = store.get('ns_internal') === '1';

function track(kind, extra = {}) {
  const body = JSON.stringify({ sid: sid(), kind, lang, internal, problem_type: current.problem_type, ...extra });
  try { fetch('/api/event', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }); } catch { /* ignore */ }
}

async function api(path, body) {
  const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sid: sid(), internal, language: lang, ...body }) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || t('error', 'Something went wrong. Try again, or call 15100.'));
  return json;
}

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null) n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return n;
}

function applyLang() {
  document.documentElement.lang = lang;
  for (const n of document.querySelectorAll('[data-i18n]')) {
    if (!n.dataset.en) n.dataset.en = n.textContent;
    n.textContent = lang === 'en' ? n.dataset.en : t(n.dataset.i18n, n.dataset.en);
  }
  for (const n of document.querySelectorAll('[data-i18n-ph]')) {
    if (!n.dataset.enPh) n.dataset.enPh = n.placeholder;
    n.placeholder = lang === 'en' ? n.dataset.enPh : t(n.dataset.i18nPh, n.dataset.enPh);
  }
  $('#lang-toggle').textContent = lang === 'en' ? 'हिंदी' : 'English';
  renderAidCats();
}

function addMsg(role, text) {
  const n = el('div', { class: `msg ${role}` }, el('span', { class: 'who' }, role === 'user' ? t('you', 'You') : 'Nyay Saathi'), el('p', {}, text));
  $('#log').append(n);
  n.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  return n;
}

function helplineLink(h) {
  return el('a', { class: 'tel', href: `tel:${h.number}`, 'data-helpline': h.number }, `📞 ${h.number}`, ' ', el('span', { class: 'muted' }, h.name));
}

function renderGuidance(g) {
  const box = $('#guidance');
  box.replaceChildren();
  if (!g) return;
  box.append(...[
    el('h2', {}, g.title),
    g.urgent ? el('p', { class: 'urgent' }, lang === 'hi' ? 'ख़तरे में हैं? अभी 112 पर कॉल करें।' : 'In danger? Call 112 now.') : null,
    el('h3', {}, t('steps', 'Next steps')),
    el('ol', {}, g.steps.map((s) => el('li', {}, s))),
    g.helplines.length ? el('h3', {}, t('helplines', 'Helplines')) : null,
    el('div', { class: 'col' }, g.helplines.map(helplineLink)),
    el('h3', {}, t('sources', 'Official sources')),
    el('ul', { class: 'sources' }, g.sources.map((u) => el('li', {}, el('a', { href: u, target: '_blank', rel: 'noopener' }, u.replace(/^https?:\/\//, ''))))),
    el('p', { class: 'fine' }, g.disclaimer),
  ].filter(Boolean));
}

function renderAidCats() {
  if (!config) return;
  const wrap = $('#aid-cats');
  const checked = new Set([...wrap.querySelectorAll('input:checked')].map((i) => i.value));
  wrap.replaceChildren(...Object.entries(config.aid_categories).map(([id, label]) =>
    el('label', { class: 'check' }, Object.assign(el('input', { type: 'checkbox', value: id }), { checked: checked.has(id) }), ' ', lang === 'hi' ? CAT_HI[id] || label : label)));
}

function renderAidResult(r) {
  const labels = { eligible: lang === 'hi' ? '✅ आप मुफ़्त कानूनी सहायता के पात्र हैं' : '✅ You are entitled to free legal aid', check_with_dlsa: lang === 'hi' ? 'ℹ️ अपने ज़िला विधिक सेवा प्राधिकरण से पुष्टि करें' : 'ℹ️ Confirm with your District Legal Services Authority', need_more_info: lang === 'hi' ? 'थोड़ी और जानकारी चाहिए' : 'Need a little more information' };
  $('#aid-result').replaceChildren(el('div', { class: `aid ${r.result}` }, el('strong', {}, labels[r.result] || r.result), el('p', {}, r.reason), el('p', {}, r.next), helplineLink({ number: '15100', name: 'NALSA' })));
}

function renderDrafts(kinds, made = []) {
  const box = $('#drafts');
  box.replaceChildren(el('h2', {}, t('draft', 'Draft letter')));
  if (!kinds?.length) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  const madeBy = Object.fromEntries(made.map((d) => [d.kind, d]));
  for (const kind of kinds) {
    const spec = config.drafts[kind];
    if (!spec) continue;
    const out = el('pre', { class: 'draft-text' }, madeBy[kind]?.text || '');
    const form = el('form', { class: 'draft-form' },
      el('p', { class: 'muted' }, t('fill_note', 'Fill what you know; the rest stays in [brackets]. Check everything before you sign.')),
      spec.fields.map((f) => el('label', {}, FIELD_LABELS[f] || f, f.endsWith('summary') || f === 'information_sought' ? el('textarea', { name: f, rows: '3', maxlength: '600' }) : el('input', { name: f, maxlength: '200' }))),
      el('button', { type: 'submit' }, t('make_draft', 'Make the letter')));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fields = Object.fromEntries(new FormData(form).entries());
      try { const d = await api('/api/draft', { kind, fields, problem_type: current.problem_type }); out.textContent = d.text; actions.classList.remove('hidden'); } catch (err) { out.textContent = err.message; }
    });
    const copyBtn = el('button', { type: 'button', class: 'secondary' }, t('copy', 'Copy'));
    copyBtn.addEventListener('click', async () => { try { await navigator.clipboard.writeText(out.textContent); copyBtn.textContent = t('copied', 'Copied'); track('draft_copied', { value: kind }); } catch { /* ignore */ } });
    const dlBtn = el('button', { type: 'button', class: 'secondary' }, t('download', 'Download'));
    dlBtn.addEventListener('click', () => {
      const a = el('a', { href: URL.createObjectURL(new Blob([out.textContent], { type: 'text/plain' })), download: `${kind}.txt` });
      a.click(); track('draft_downloaded', { value: kind });
    });
    const actions = el('div', { class: `row gap ${madeBy[kind] ? '' : 'hidden'}` }, copyBtn, dlBtn);
    box.append(el('details', { open: '' }, el('summary', {}, spec.title), form, out, actions));
  }
}

function showResult(r) {
  current.problem_type = r.problem_type || current.problem_type;
  $('#choices').replaceChildren(...(r.choices || []).map((c) => el('button', { type: 'button', class: 'chip', onclick: () => ask(c.title, c.id) }, c.title)));
  if (r.guidance) {
    $('#result').classList.remove('hidden');
    renderGuidance(r.guidance);
    renderDrafts(r.guidance.drafts_available, r.drafts);
    store.set('ns_last_help', String(Date.now()));
  }
  if (r.eligibility) renderAidResult(r.eligibility);
}

async function ask(text, problem_type) {
  addMsg('user', text);
  const pending = addMsg('bot', t('thinking', 'Thinking…'));
  $('#send').disabled = true;
  try {
    const r = await api('/api/chat', { message: text, history, problem_type });
    pending.querySelector('p').textContent = r.reply;
    history.push({ role: 'user', content: text }, { role: 'assistant', content: r.reply });
    showResult(r);
  } catch (err) {
    pending.querySelector('p').textContent = err.message;
  } finally { $('#send').disabled = false; }
}

$('#ask').addEventListener('submit', (e) => { e.preventDefault(); const v = $('#msg').value.trim(); if (!v) return; $('#msg').value = ''; ask(v); });
$('#msg').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#ask').requestSubmit(); } });
$('#lang-toggle').addEventListener('click', () => { lang = lang === 'en' ? 'hi' : 'en'; store.set('ns_lang', lang); applyLang(); });
$('#aid-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const categories = [...document.querySelectorAll('#aid-cats input:checked')].map((i) => i.value);
  const income = $('#aid-income').value;
  try { renderAidResult(await api('/api/aid', { categories, annual_income_inr: income === '' ? undefined : Number(income), state: $('#aid-state').value })); } catch (err) { $('#aid-result').textContent = err.message; }
});
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-helpline]');
  if (a) track('helpline_tapped', { value: a.dataset.helpline });
  const fb = e.target.closest('[data-fb]');
  if (fb) { track('feedback', { value: fb.dataset.fb }); $('#feedback').replaceChildren(el('p', {}, t('thanks', 'Thank you!'))); }
  const fu = e.target.closest('[data-fu]');
  if (fu) { track('followup', { value: fu.dataset.fu }); store.set('ns_followup_done', store.get('ns_last_help') || '1'); $('#followup').replaceChildren(el('p', {}, t('thanks', 'Thank you!'))); }
});

// Follow-up: ask returning visitors (3+ days after they got help) whether they acted. Once per help visit.
const last = Number(store.get('ns_last_help') || 0);
if (last && Date.now() - last > 3 * 86400000 && store.get('ns_followup_done') !== String(last)) $('#followup').classList.remove('hidden');

fetch('/api/config').then((r) => r.json()).then((c) => { config = c; applyLang(); }).catch(() => applyLang());
track('page_view');
