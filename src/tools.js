// Deterministic tools the agent can call. They never invent facts: guidance comes from
// knowledge.js, eligibility from section 12 of the Legal Services Authorities Act, 1987,
// and drafts are fill-in templates the citizen reviews before using.
import { PROBLEMS, HELPLINES, DISCLAIMER } from './knowledge.js';

const LANGS = new Set(['en', 'hi', 'te']);
const lang = (l) => (LANGS.has(l) ? l : 'en');

export function getGuidance({ problem_type, language }) {
  const p = PROBLEMS[problem_type];
  if (!p) return { error: `unknown problem_type. Use one of: ${Object.keys(PROBLEMS).join(', ')}` };
  const l = lang(language);
  // steps may be language-keyed (p.steps.en / p.steps.te) or a plain array for legacy entries.
  let steps = [];
  if (Array.isArray(p.steps)) steps = p.steps;
  else if (p.steps && (p.steps[l] || p.steps.en)) steps = p.steps[l] || p.steps.en;
  return {
    problem_type,
    title: p.title[l] || p.title.en,
    urgent: Boolean(p.urgent),
    steps,
    helplines: p.helplines.map((h) => HELPLINES[h]),
    drafts_available: p.drafts,
    sources: p.sources,
    disclaimer: DISCLAIMER[l],
  };
}

// Section 12, Legal Services Authorities Act, 1987: categories entitled to free legal services.
export const AID_CATEGORIES = {
  sc_st: 'Member of a Scheduled Caste or Scheduled Tribe',
  trafficking: 'Victim of trafficking in human beings or forced labour (begar)',
  woman: 'Woman',
  child: 'Child (below 18)',
  disability: 'Person with a disability',
  disaster: 'Victim of mass disaster, ethnic violence, caste atrocity, flood, drought, earthquake or industrial disaster',
  industrial_worker: 'Industrial workman',
  custody: 'Person in custody (including protective home, juvenile home, psychiatric hospital)',
};

export function checkLegalAid({ categories = [], annual_income_inr, state } = {}) {
  const valid = (Array.isArray(categories) ? categories : []).filter((c) => AID_CATEGORIES[c]);
  const next = 'Call 15100 (NALSA) or visit the District Legal Services Authority at your district court to apply. Bring an ID and any papers about your case.';
  if (valid.length) {
    return {
      result: 'eligible',
      reason: `Entitled to free legal aid under section 12 of the Legal Services Authorities Act, 1987 as: ${valid.map((c) => AID_CATEGORIES[c]).join('; ')}. Income does not matter for this category.`,
      next,
    };
  }
  const income = Number(annual_income_inr);
  if (Number.isFinite(income) && income >= 0) {
    // The income ceiling is notified by each State Government and changes over time, so
    // we do not hard-code a number we cannot keep current (see CONTRIBUTING.md to add a
    // sourced per-state table).
    return {
      result: 'check_with_dlsa',
      reason: `Income-based eligibility depends on the limit notified by ${state ? `the ${state} government` : 'your state government'}. Ask the District Legal Services Authority whether ₹${income.toLocaleString('en-IN')} a year qualifies.`,
      next,
    };
  }
  return {
    result: 'need_more_info',
    reason: 'Tell me if you belong to any listed category (woman, child, SC/ST, person with disability, industrial worker, disaster victim, in custody) or your yearly family income.',
    categories: AID_CATEGORIES,
    next,
  };
}

const clean = (v, max = 600) => String(v ?? '').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').trim().slice(0, max);
const blank = (v, label) => clean(v) || `[${label}]`;
const today = () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

export const DRAFT_KINDS = {
  legal_aid: {
    title: 'Application for free legal aid',
    fields: ['name', 'address', 'phone', 'district', 'state', 'category_or_income', 'problem_summary'],
    render: (f) => `To,
The Member Secretary,
District Legal Services Authority, ${blank(f.district, 'District')}, ${blank(f.state, 'State')}

Subject: Application for free legal services under section 12 of the Legal Services Authorities Act, 1987

Sir/Madam,

I, ${blank(f.name, 'Your full name')}, residing at ${blank(f.address, 'Your address')}, request free legal services.

I am eligible because: ${blank(f.category_or_income, 'e.g. I am a woman / my yearly family income is ₹___')}.

My problem in brief:
${blank(f.problem_summary, 'Describe what happened, when, and who is involved')}

I request that a panel lawyer be assigned to advise and represent me. I will provide any documents required.

Phone: ${blank(f.phone, 'Your phone number')}
Date: ${today()}

Signature / thumb impression
${blank(f.name, 'Your full name')}`,
  },
  rti: {
    title: 'RTI application (Right to Information Act, 2005)',
    fields: ['name', 'address', 'phone', 'office_name', 'office_address', 'information_sought', 'bpl'],
    render: (f) => `To,
The Public Information Officer,
${blank(f.office_name, 'Name of the office / department')}
${blank(f.office_address, 'Address of the office')}

Subject: Request for information under section 6(1) of the Right to Information Act, 2005

Sir/Madam,

Please provide the following information:
${blank(f.information_sought, '1. The current status of my application no. ___ dated ___\n2. The name of the officer it is pending with\n3. Copies of file notings on it')}

${/^(y|yes|true|1)$/i.test(clean(f.bpl)) ? 'I belong to the Below Poverty Line category. A copy of my BPL card is attached, so no fee is payable.' : 'The application fee of ₹10 is paid by [postal order / court fee stamp / online receipt no. ___].'}

I request the information within 30 days as required by section 7(1) of the Act.

Name: ${blank(f.name, 'Your full name')}
Address: ${blank(f.address, 'Your address')}
Phone: ${blank(f.phone, 'Your phone number')}
Date: ${today()}

Signature`,
  },
  consumer_complaint: {
    title: 'Consumer complaint (to the seller, before going to the Commission)',
    fields: ['name', 'address', 'phone', 'seller_name', 'seller_address', 'purchase_date', 'amount_inr', 'problem_summary', 'relief_sought'],
    render: (f) => `To,
${blank(f.seller_name, 'Seller / company name')}
${blank(f.seller_address, 'Seller address or customer-care email')}

Subject: Complaint about deficiency in goods/service and demand for remedy

Sir/Madam,

On ${blank(f.purchase_date, 'date of purchase')} I paid ₹${blank(f.amount_inr, 'amount')} to you. The problem:
${blank(f.problem_summary, 'Describe the defect or service failure and what you already tried')}

I ask you to ${blank(f.relief_sought, 'refund ₹___ / replace the product / repair it')} within 15 days of this letter.

If this is not done, I will file a complaint before the District Consumer Disputes Redressal Commission under the Consumer Protection Act, 2019, and claim compensation and costs.

${blank(f.name, 'Your full name')}
${blank(f.address, 'Your address')}
Phone: ${blank(f.phone, 'Your phone number')}
Date: ${today()}`,
  },
  wage_demand: {
    title: 'Written demand for unpaid wages',
    fields: ['name', 'address', 'phone', 'employer_name', 'employer_address', 'work_period', 'amount_inr'],
    render: (f) => `To,
${blank(f.employer_name, 'Employer / contractor name')}
${blank(f.employer_address, 'Employer address')}

Subject: Payment of my unpaid wages

I worked for you from ${blank(f.work_period, 'start date to end date')}. Wages of ₹${blank(f.amount_inr, 'amount')} are still unpaid.

Please pay the full amount within 7 days of this letter. If it is not paid, I will file a claim with the Labour Department and seek free legal aid.

${blank(f.name, 'Your full name')}
${blank(f.address, 'Your address')}
Phone: ${blank(f.phone, 'Your phone number')}
Date: ${today()}`,
  },
  sp_complaint: {
    title: 'Complaint to the Superintendent of Police (FIR not registered)',
    fields: ['name', 'address', 'phone', 'district', 'police_station', 'incident_date', 'incident_summary', 'date_approached'],
    render: (f) => `To,
The Superintendent of Police,
${blank(f.district, 'District')}

Subject: Refusal to register FIR at ${blank(f.police_station, 'Police Station name')} – complaint under section 173(4), Bharatiya Nagarik Suraksha Sanhita, 2023

Sir/Madam,

On ${blank(f.incident_date, 'date of incident')} the following happened:
${blank(f.incident_summary, 'What happened, where, who was involved, any witnesses')}

On ${blank(f.date_approached, 'date')} I went to ${blank(f.police_station, 'Police Station name')} to report this, but the FIR was not registered.

I request you to register an FIR and order an investigation, or direct the officer in charge to do so.

${blank(f.name, 'Your full name')}
${blank(f.address, 'Your address')}
Phone: ${blank(f.phone, 'Your phone number')}
Date: ${today()}

Enclosures: [copies of any written complaint, photos, medical report]`,
  },
};

export function draftDocument({ kind, fields = {} } = {}) {
  const d = DRAFT_KINDS[kind];
  if (!d) return { error: `unknown kind. Use one of: ${Object.keys(DRAFT_KINDS).join(', ')}` };
  const f = {};
  for (const k of d.fields) f[k] = fields?.[k];
  const missing = d.fields.filter((k) => !clean(f[k]));
  return { kind, title: d.title, text: d.render(f), missing_fields: missing, note: 'Fill anything in [brackets] before you sign. Keep a copy.' };
}

// Tool schemas in OpenAI-compatible function-calling format.
export const TOOL_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'get_guidance',
      description: 'Get verified step-by-step guidance, helplines and official sources for a legal problem type. Always call this before advising.',
      parameters: {
        type: 'object',
        properties: {
          problem_type: { type: 'string', enum: Object.keys(PROBLEMS) },
          language: { type: 'string', enum: ['en', 'hi', 'te'] },
        },
        required: ['problem_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_legal_aid',
      description: 'Check eligibility for free legal aid under section 12 of the Legal Services Authorities Act, 1987.',
      parameters: {
        type: 'object',
        properties: {
          categories: { type: 'array', items: { type: 'string', enum: Object.keys(AID_CATEGORIES) } },
          annual_income_inr: { type: 'number' },
          state: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'draft_document',
      description: 'Create a fill-in draft letter for the citizen. Pass only facts the user actually gave; leave unknown fields out.',
      parameters: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: Object.keys(DRAFT_KINDS) },
          fields: { type: 'object', additionalProperties: { type: 'string' } },
        },
        required: ['kind'],
      },
    },
  },
];

export const TOOL_IMPLS = {
  get_guidance: getGuidance,
  check_legal_aid: checkLegalAid,
  draft_document: draftDocument,
};
