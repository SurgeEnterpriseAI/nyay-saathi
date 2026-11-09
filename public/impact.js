const $ = (s) => document.querySelector(s);
const TITLES = { unpaid_wages: 'Unpaid wages', consumer: 'Consumer problem', domestic_violence: 'Violence at home', police_fir: 'Police / FIR', cheque_bounce: 'Cheque bounce', government_info: 'Government information (RTI)', case_status: 'Court case status', land_property: 'Land / house / rent' };

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  for (const c of kids.flat()) if (c != null) n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return n;
}
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const rows = (pairs) => pairs.map(([k, v]) => el('tr', {}, el('td', {}, k), el('td', { class: 'num' }, fmt(v))));

fetch('/api/impact').then((r) => r.json()).then((s) => {
  const tiles = [
    ['People helped', s.people_helped, 'unique devices that got guidance'],
    ['Visitors', s.visitors, 'unique devices'],
    ['Letters drafted', s.drafts_made, `${fmt(s.drafts_taken)} copied or downloaded`],
    ['Legal-aid checks', s.aid_checks, 'eligibility checks run'],
    ['Helpline taps', s.helpline_taps, 'calls started to 15100, 112, 181…'],
    ['Found it helpful', s.feedback.total ? `${Math.round((100 * s.feedback.helpful) / s.feedback.total)}%` : '–', `${fmt(s.feedback.total)} answers`],
  ];
  $('#tiles').replaceChildren(...tiles.map(([k, v, sub]) => el('div', { class: 'tile' }, el('div', { class: 'big' }, typeof v === 'number' ? fmt(v) : v), el('div', {}, k), el('div', { class: 'fine' }, sub))));

  const max = Math.max(1, ...s.daily.map((d) => d.helped));
  $('#daily').replaceChildren(...(s.daily.length ? s.daily.map((d) => {
    // CSSOM writes are allowed under the strict CSP; inline style attributes are not.
    const b = el('div', { class: 'bar', title: `${d.day}: ${d.helped} helped, ${d.visitors} visitors` }, el('span', { class: 'sr' }, `${d.day}: ${d.helped}`));
    b.style.setProperty('--h', `${(100 * d.helped) / max}%`);
    return b;
  }) : [el('p', { class: 'muted' }, 'No usage recorded yet.')]));

  const bp = Object.entries(s.by_problem).map(([k, v]) => [TITLES[k] || k, v]);
  $('#by-problem').replaceChildren(...(bp.length ? rows(bp) : [el('tr', {}, el('td', {}, 'No data yet'))]));
  $('#outcomes').replaceChildren(...rows([
    ['Said they took the next step', s.followups.took_step],
    ['Said their problem was solved', s.followups.resolved],
    ['Not yet', s.followups.not_yet],
    ['Letters copied or downloaded', s.drafts_taken],
  ]));
  $('#meta').textContent = `Counting since ${s.first_event_day || '—'}. Updated ${new Date(s.generated_at).toLocaleString('en-IN')}. Excluded: ${fmt(s.excluded.bot_events)} automated events, ${fmt(s.excluded.internal_events)} internal test events. Follow-up answers are self-reported.`;
}).catch(() => { $('#tiles').textContent = 'Could not load numbers.'; });
