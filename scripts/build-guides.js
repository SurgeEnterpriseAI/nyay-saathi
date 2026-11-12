// Builds the static, crawlable guide pages in public/guides/ (plain HTML, no JS needed).
// Run after changing a guide or a letter template: node scripts/build-guides.js
// Facts here must come from src/knowledge.js, src/tools.js or an official source named on the page.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { draftDocument, AID_CATEGORIES } from '../src/tools.js';
import { HELPLINES, LINKS, DISCLAIMER } from '../src/knowledge.js';

const SITE = 'https://nyaysaathi.surgesoftware.co.in';
const UPDATED = '2026-11-12';
const UPDATED_TEXT = '12 November 2026';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'guides');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const host = (u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const a = (u, text = host(u)) => `<a href="${esc(u)}">${esc(text)}</a>`;
const tel = (n) => `<a class="tel" href="tel:${n}">${n}</a>`;
const H = HELPLINES;

// Letter template exactly as the tool produces it, with today's date left as a blank.
const template = (kind) => draftDocument({ kind, fields: {} }).text.replace(/^Date: .*$/m, 'Date: [Date]');
const letterBlock = (kind) => `
    <div class="card">
      <h2>The letter Nyay Saathi drafts: ${esc(draftDocument({ kind }).title)}</h2>
      <p class="muted">This is the template. In the app you describe your problem, fill in what you know, and copy or download the letter. Anything you leave out stays in [brackets] for you to complete by hand before you sign. Keep a copy.</p>
      <pre class="draft-text">${esc(template(kind))}</pre>
      <p><a class="button" href="/">Draft this letter free on Nyay Saathi</a></p>
    </div>`;

const steps = (items) => `<ol>${items.map((s) => `<li>${s}</li>`).join('')}</ol>`;

const PAGES = [
  {
    slug: 'free-legal-help-websites-india',
    title: 'Free legal help websites in India: what each one does',
    description: 'NALSA (15100), Tele-Law, Nyaaya, National Consumer Helpline, RTI Online, e-Courts and Nyay Saathi: which free service to use for which legal problem in India.',
    lead: 'India has several free, official or non-profit services for people with a legal problem. They do different jobs, so the right one depends on what you need: a free lawyer, advice, plain-language explanations of the law, a consumer grievance, government information, or your court date. This guide says what each one does and where Nyay Saathi fits.',
    body: `
    <div class="card">
      <h2>NALSA and the Legal Services Authorities: a free lawyer and Lok Adalats</h2>
      <p>${a(LINKS.nalsa)} · helpline ${tel(H.legalAid.number)}</p>
      <p>The National Legal Services Authority (NALSA) was set up under the Legal Services Authorities Act, 1987 to give free legal services to weaker sections of society and to organise Lok Adalats, where disputes are settled by agreement. Each state has a State Legal Services Authority, and the District Legal Services Authority (DLSA) at your district court is where you apply for a free lawyer.</p>
      <p><strong>Use it when</strong> you need a lawyer and cannot afford one, or you want to settle a dispute at a Lok Adalat. See <a href="/guides/who-can-get-free-lawyer-india">who can get a free lawyer</a>.</p>
    </div>
    <div class="card">
      <h2>Tele-Law: talk to a panel lawyer for advice</h2>
      <p>${a(LINKS.teleLaw)}</p>
      <p>Tele-Law is run by the Department of Justice with CSC e-Governance Services India Limited, with NALSA as a partner. It connects people with panel lawyers for legal advice through Common Service Centres (CSCs) and the Citizens' Tele-Law mobile app.</p>
      <p><strong>Use it when</strong> you want to speak to a lawyer for advice, for example from a CSC near your village.</p>
    </div>
    <div class="card">
      <h2>Nyaaya: plain-language explainers of Indian laws</h2>
      <p>${a('https://nyaaya.org')}</p>
      <p>Nyaaya is an open-access digital resource with legal explainers grouped by theme (such as family and marriage, or police and courts), guides, videos, and sample forms and templates, with Hindi and Kannada versions. Through "Ask Nyaaya" you can send a legal question to be answered by experts and volunteers.</p>
      <p><strong>Use it when</strong> you want to read about a law and your rights in depth.</p>
    </div>
    <div class="card">
      <h2>National Consumer Helpline and e-Daakhil: consumer problems</h2>
      <p>${a(LINKS.consumerHelpline)} · helpline ${tel(H.consumer.number)} · ${a(LINKS.edaakhil)}</p>
      <p>The National Consumer Helpline is run by the Department of Consumer Affairs. You register a grievance (by phone on 1915, on the portal, or on its app), it is forwarded to the company, and you track the status online. If that does not solve it, you can file a complaint with the District Consumer Commission yourself, without a lawyer, on e-Daakhil.</p>
      <p><strong>Use it when</strong> a seller or service provider has cheated you or will not refund. See the <a href="/guides/consumer-complaint-letter-format">consumer complaint letter</a>.</p>
    </div>
    <div class="card">
      <h2>RTI Online: information from a government office</h2>
      <p>${a(LINKS.rtiOnline)}</p>
      <p>Under the Right to Information Act, 2005 you can ask a public office for information, such as the status of your pension, ration card or application. RTI Online takes applications to central government offices; for state offices, many states have their own portal, or you send it by post to the Public Information Officer.</p>
      <p><strong>Use it when</strong> a government application is stuck. See the <a href="/guides/rti-application-format">RTI application format</a>.</p>
    </div>
    <div class="card">
      <h2>e-Courts services: your case status and next hearing date</h2>
      <p>${a(LINKS.ecourts)}</p>
      <p>Enter the 16-character CNR number from any court paper to see the next date, the stage of the case and orders. The free eCourts Services mobile app does the same. Without a CNR you can search by party name.</p>
    </div>
    <div class="card">
      <h2>Cyber crime portal and 1930: online fraud</h2>
      <p>${a(LINKS.cyber)} · helpline ${tel(H.cyber.number)}</p>
      <p>For online fraud or cyber crime, call 1930 immediately and report at cybercrime.gov.in.</p>
    </div>
    <div class="card">
      <h2>Where Nyay Saathi fits: a starting point that sends you to the right one</h2>
      <p>Nyay Saathi is a free, open-source legal-help guide. It works alongside the services above, not instead of them. You describe what happened in your own words, in English or Hindi, and it:</p>
      <ol>
        <li>works out which of eight common problems you have (unpaid wages, consumer fraud, violence at home, police not filing an FIR, cheque bounce, a stuck government application, court case status, land or tenancy);</li>
        <li>gives sourced next steps with the right helpline and official link from the list above;</li>
        <li>checks whether you can get a free lawyer under section 12 of the Legal Services Authorities Act, 1987;</li>
        <li>drafts the letter you need: a <a href="/guides/who-can-get-free-lawyer-india">legal aid application</a>, an <a href="/guides/rti-application-format">RTI application</a>, a <a href="/guides/consumer-complaint-letter-format">consumer complaint</a>, a <a href="/guides/unpaid-salary-demand-letter">demand for unpaid wages</a> or a <a href="/guides/police-not-registering-fir-complaint-to-sp">complaint to the Superintendent of Police</a>.</li>
      </ol>
      <p>No sign-up, no tracking cookies, and nothing you type is saved. It does not assign you a lawyer, file anything for you or track your case: for those it points you to NALSA, the DLSA, the consumer helpline, RTI Online or e-Courts.</p>
      <p><a class="button" href="/">Describe your problem on Nyay Saathi</a></p>
    </div>`,
    faq: [
      ['Which free website helps me get a free lawyer in India?', 'Free lawyers come through the Legal Services Authorities set up under the Legal Services Authorities Act, 1987: call the NALSA helpline 15100 or visit the District Legal Services Authority at your district court. Nyay Saathi checks whether you fall in a section 12 category and drafts the application for you to take there.'],
      ['Is there a free website that drafts legal letters in India?', 'Nyay Saathi drafts five fill-in letters for free: an application for free legal aid, an RTI application, a consumer complaint to the seller, a written demand for unpaid wages and a complaint to the Superintendent of Police when the FIR is not registered. Nyaaya also publishes sample forms and templates.'],
      ['Where can I read about my legal rights in simple language?', 'Nyaaya (nyaaya.org) publishes plain-language explainers of Indian laws, with Hindi and Kannada versions. Nyay Saathi gives short, sourced next steps for eight common problems.'],
      ['How do I talk to a lawyer for advice without going to court?', 'Tele-Law, run by the Department of Justice, connects people with panel lawyers through Common Service Centres and the Citizens\' Tele-Law mobile app. You can also call 15100 for legal aid.'],
      ['Do I need to sign up to use Nyay Saathi?', 'No. There is no sign-up and no tracking cookies, and nothing you type is saved.'],
      ['Is Nyay Saathi a replacement for a lawyer?', 'No. It gives general legal information, not legal advice. For your case, talk to a lawyer; legal aid lawyers are free if you qualify (call 15100).'],
    ],
  },
  {
    slug: 'who-can-get-free-lawyer-india',
    title: 'Who can get a free lawyer in India? Section 12, Legal Services Authorities Act',
    description: 'Section 12 of the Legal Services Authorities Act, 1987 lists who gets free legal aid in India: women, children, SC/ST, people with disabilities, industrial workers and more. How to apply via 15100 or your DLSA.',
    lead: 'In India, many people are entitled by law to a free lawyer, whatever their income. The list is in section 12 of the Legal Services Authorities Act, 1987. Women and children alone are more than half the population, yet most people have never heard of legal aid.',
    body: `
    <div class="card">
      <h2>Who is entitled (section 12)</h2>
      <p>Anyone who has to file or defend a case is entitled to free legal services if they are:</p>
      <ul>${Object.values(AID_CATEGORIES).map((c) => `<li>${esc(c)}</li>`).join('')}<li>A person whose yearly income is below the limit set by the State Government (or by the Central Government for cases in the Supreme Court)</li></ul>
      <p>If you are in one of the first eight groups, <strong>your income does not matter</strong>.</p>
      <p>The income limit is set by each state and changes over time, so Nyay Saathi does not guess a number. Ask your District Legal Services Authority whether your family income qualifies.</p>
    </div>
    <div class="card">
      <h2>What else the law says</h2>
      <ul>
        <li>The Legal Services Authority must be satisfied that you have a <em>prima facie</em> case to bring or defend (section 13(1)).</li>
        <li>An affidavit about your income can be enough to show you are eligible, unless the Authority has reason to disbelieve it (section 13(2)).</li>
        <li>Legal Services Authorities also run Lok Adalats. A Lok Adalat award is final and binding, with no appeal against it (section 21(2)). There is no court fee, and if a court case is settled there, the court fee already paid is refunded (section 21(1)).</li>
      </ul>
      <p class="fine">Source: the Legal Services Authorities Act, 1987, as published by NALSA at ${a(LINKS.nalsa)}.</p>
    </div>
    <div class="card">
      <h2>How to apply</h2>
      ${steps([
        `Call ${tel(H.legalAid.number)} (NALSA legal aid helpline), or visit the District Legal Services Authority at your district court.`,
        'Bring an ID and any papers about your case.',
        'Say which group you belong to, or what your yearly family income is, and what your problem is. The written application below covers all three.',
      ])}
      <p>Not sure if you qualify? <a href="/">Nyay Saathi's legal aid check</a> asks which groups apply to you and tells you whether you are entitled or should confirm your income with the DLSA.</p>
    </div>
    ${letterBlock('legal_aid')}`,
    faq: [
      ['Can a woman get a free lawyer in India regardless of income?', 'Yes. Section 12(c) of the Legal Services Authorities Act, 1987 makes every woman and every child entitled to free legal services, whatever their income.'],
      ['What is the income limit for free legal aid?', 'Each State Government sets its own limit (the Central Government sets it for Supreme Court cases), and it changes over time. Ask your District Legal Services Authority, or call 15100, whether your yearly family income qualifies.'],
      ['Are industrial workers entitled to free legal aid?', 'Yes. An industrial workman is one of the categories in section 12, so income does not matter.'],
      ['How do I apply for a free lawyer?', 'Call 15100 or go to the District Legal Services Authority at your district court with an ID and your case papers. You can hand in a written application; Nyay Saathi drafts one for free.'],
      ['Do I have to prove my income?', 'An affidavit about your income can be enough, unless the Authority has reason to disbelieve it (section 13(2)).'],
    ],
  },
  {
    slug: 'rti-application-format',
    title: 'RTI application format: ask a government office for information',
    description: 'Free RTI application format under the Right to Information Act, 2005: fee ₹10 (nil for BPL), reply within 30 days, first appeal within 30 days, and where to file online.',
    lead: 'If a government office is sitting on your pension, ration card or any application, the Right to Information Act, 2005 lets you ask it for the status in writing. Here is what to do and the application Nyay Saathi drafts.',
    body: `
    <div class="card">
      <h2>Steps</h2>
      ${steps([
        'Under the Right to Information Act, 2005 you can ask any public office for information, for example the status of your pension, ration card or application.',
        'Write a short RTI application (the template below). The fee is ₹10; people below the poverty line pay nothing (attach a copy of the BPL card).',
        `For central government offices you can file online at ${a(LINKS.rtiOnline)}. For state offices, many states have their own portal, or send it by post to the Public Information Officer.`,
        'The office must reply within 30 days. If it does not, or the reply is wrong, file a first appeal within 30 days.',
      ])}
    </div>
    ${letterBlock('rti')}`,
    faq: [
      ['What is the fee for an RTI application?', '₹10. People below the poverty line pay nothing if they attach a copy of their BPL card.'],
      ['How long does the office have to reply to an RTI?', '30 days, under section 7(1) of the Right to Information Act, 2005.'],
      ['What if I get no reply or a wrong reply?', 'File a first appeal within 30 days.'],
      ['Where do I file an RTI online?', 'For central government offices, at rtionline.gov.in. For state offices, many states have their own portal; otherwise send it by post to the Public Information Officer of that office.'],
    ],
  },
  {
    slug: 'consumer-complaint-letter-format',
    title: 'Consumer complaint letter format: refund, replacement or repair',
    description: 'Free consumer complaint letter to the seller, then the National Consumer Helpline (1915) and e-Daakhil. File with the District Consumer Commission yourself, within 2 years.',
    lead: 'Paid for something that was defective, or a service that was not delivered? Complain to the seller in writing first. If that fails, the National Consumer Helpline and the District Consumer Commission are free routes that do not need a lawyer.',
    body: `
    <div class="card">
      <h2>Steps</h2>
      ${steps([
        'Collect the bill or invoice, order screenshots, warranty card and every message with the seller.',
        'Complain to the seller in writing first and give a date to fix it (for example 15 days). The template below does this.',
        `Register a free grievance with the National Consumer Helpline: call ${tel(H.consumer.number)} or use ${a(LINKS.consumerHelpline)}.`,
        `If it is still unresolved, file a complaint with the District Consumer Commission online on ${a(LINKS.edaakhil, 'e-Daakhil')}. You can file it yourself without a lawyer. Claims up to ₹50 lakh go to the District Commission.`,
        'File within 2 years of the problem arising.',
      ])}
    </div>
    ${letterBlock('consumer_complaint')}`,
    faq: [
      ['Do I need a lawyer to file a consumer complaint?', 'No. You can file a complaint with the District Consumer Commission yourself, online on e-Daakhil.'],
      ['What is the National Consumer Helpline number?', '1915. You can also register a grievance at consumerhelpline.gov.in.'],
      ['How long do I have to file a consumer complaint?', 'File within 2 years of the problem arising.'],
      ['Which Consumer Commission do I go to?', 'Claims up to ₹50 lakh go to the District Consumer Commission.'],
    ],
  },
  {
    slug: 'unpaid-salary-demand-letter',
    title: 'Unpaid salary or wages: demand letter and what to do next',
    description: 'Free demand letter for unpaid wages in India, then a free claim at the district Labour Department office and free legal aid on 15100.',
    lead: 'If your employer or contractor has not paid you, start with a written demand. If that does not work, a claim at the Labour Department is free, and workers can usually get free legal help.',
    body: `
    <div class="card">
      <h2>Steps</h2>
      ${steps([
        'Write down what you are owed: dates worked, daily or monthly rate, total due, and the employer or contractor name and address.',
        'Keep any proof: attendance register photos, WhatsApp messages, bank transfers, witnesses who worked with you.',
        'Send a short written demand to the employer (the template below). Keep a copy or photo.',
        'If you are not paid, file a claim at your district Labour Department office (Labour Commissioner / Assistant Labour Commissioner). Filing a claim there is free.',
        `Call ${tel(H.legalAid.number)} for free legal aid if the employer still refuses. Workers are usually eligible for free legal help; an industrial workman is entitled under section 12 of the Legal Services Authorities Act, 1987 whatever their income.`,
      ])}
    </div>
    ${letterBlock('wage_demand')}`,
    faq: [
      ['What can I do if my employer does not pay my salary?', 'Send a written demand, keep a copy, and if you are still not paid, file a claim at your district Labour Department office. Filing there is free. Call 15100 for free legal aid.'],
      ['What proof should I keep?', 'Attendance register photos, WhatsApp messages, bank transfers, and names of witnesses who worked with you.'],
      ['Can a worker get a free lawyer?', 'Workers are usually eligible. An industrial workman is entitled to free legal services under section 12 of the Legal Services Authorities Act, 1987 whatever their income. Call 15100 to check.'],
    ],
  },
  {
    slug: 'police-not-registering-fir-complaint-to-sp',
    title: 'Police not registering your FIR: complaint to the Superintendent of Police',
    description: 'If police refuse to register an FIR, write to the Superintendent of Police under section 173(4) BNSS, then the Magistrate under section 175(3). Free complaint draft.',
    lead: 'For a serious (cognizable) offence the police must register an FIR. If the police station refuses, the law gives you two more steps, and free legal aid can help.',
    body: `
    <div class="card">
      <h2>Steps</h2>
      ${steps([
        'For a serious (cognizable) offence the police must register an FIR. You can file it at any police station; it can be transferred later ("Zero FIR").',
        'Ask for a free copy of the FIR after it is registered.',
        'If the station refuses, send your complaint in writing to the Superintendent of Police (section 173(4) of the Bharatiya Nagarik Suraksha Sanhita, 2023). Keep proof of sending. The template below does this.',
        `If that also fails, you can apply to the Magistrate (section 175(3) BNSS). Free legal aid (${tel(H.legalAid.number)}) can help you with this.`,
        `For online fraud or cyber crime, call ${tel(H.cyber.number)} immediately and report at ${a(LINKS.cyber)}.`,
      ])}
      <p class="urgent">In danger right now? Call ${tel(H.police.number)}.</p>
    </div>
    ${letterBlock('sp_complaint')}`,
    faq: [
      ['What can I do if the police refuse to register my FIR?', 'Send your complaint in writing to the Superintendent of Police under section 173(4) of the Bharatiya Nagarik Suraksha Sanhita, 2023, and keep proof of sending. If that also fails, you can apply to the Magistrate under section 175(3) BNSS.'],
      ['Can I file an FIR at any police station?', 'Yes. You can file it at any police station and it can be transferred later. This is called a Zero FIR.'],
      ['Do I have to pay for a copy of the FIR?', 'No. Ask for a free copy after it is registered.'],
      ['Who do I call for online fraud?', 'Call 1930 immediately and report at cybercrime.gov.in.'],
    ],
  },
];

function page(p) {
  const url = `${SITE}/guides/${p.slug}`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${url}#page`, url, name: p.title, description: p.description, inLanguage: 'en-IN', dateModified: UPDATED, isPartOf: { '@type': 'WebSite', name: 'Nyay Saathi', url: `${SITE}/` }, publisher: { '@type': 'Organization', name: 'Surge Software', url: 'https://surgesoftware.co.in' }, isAccessibleForFree: true },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Nyay Saathi', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: p.title, item: url }] },
      { '@type': 'FAQPage', '@id': `${url}#faq`, mainEntity: p.faq.map(([q, ans]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: ans } })) },
    ],
  };
  const others = PAGES.filter((o) => o.slug !== p.slug).map((o) => `<li><a href="/guides/${o.slug}">${esc(o.title)}</a></li>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(p.title)} | Nyay Saathi</title>
  <meta name="description" content="${esc(p.description)}">
  <link rel="canonical" href="${url}">
  <link rel="stylesheet" href="/styles.css">
  <link rel="icon" href="/icon.svg" type="image/svg+xml">
  <link rel="alternate" type="text/plain" href="/llms.txt" title="Summary for AI assistants">
  <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head>
<body>
  <header class="top"><div class="wrap row"><a class="brand" href="/"><img src="/icon.svg" alt="" width="28" height="28"> Nyay Saathi</a><nav class="row gap"><a href="/guides/free-legal-help-websites-india">Guides</a><a href="/">Get help</a></nav></div></header>
  <main class="wrap guide">
    <h1>${esc(p.title)}</h1>
    <p class="lead">${esc(p.lead)}</p>
    <p class="sos">In danger right now? ${tel(H.police.number)} · Free lawyer: ${tel(H.legalAid.number)}</p>
${p.body}
    <div class="card faq">
      <h2>Questions people ask</h2>
${p.faq.map(([q, ans]) => `      <h3>${esc(q)}</h3>\n      <p>${esc(ans)}</p>`).join('\n')}
    </div>
    <div class="card">
      <h2>More free guides</h2>
      <ul>${others}</ul>
    </div>
  </main>
  <footer class="wrap fine">
    <p>${esc(DISCLAIMER.en)}</p>
    <p>Last checked ${UPDATED_TEXT}. Steps come from Nyay Saathi's sourced knowledge base; official links are given on the page. Open source (MIT). <a href="/">Get help</a> · <a href="/impact">Impact</a></p>
  </footer>
</body>
</html>
`;
}

mkdirSync(OUT, { recursive: true });
for (const p of PAGES) writeFileSync(join(OUT, `${p.slug}.html`), page(p));
console.log(`wrote ${PAGES.length} guides to public/guides/`);
