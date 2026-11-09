// Curated, citable guidance for common legal problems faced by ordinary citizens in India.
// Every entry lists official sources. Keep statements conservative: this is legal
// information, not legal advice. Contributors: add a source for every new claim.

export const HELPLINES = {
  legalAid: { name: 'NALSA legal aid helpline', number: '15100' },
  police: { name: 'Emergency (police, ambulance, fire)', number: '112' },
  women: { name: 'Women helpline', number: '181' },
  child: { name: 'Childline', number: '1098' },
  consumer: { name: 'National Consumer Helpline', number: '1915' },
  cyber: { name: 'Cyber crime helpline', number: '1930' },
};

export const LINKS = {
  nalsa: 'https://nalsa.gov.in',
  teleLaw: 'https://www.tele-law.in',
  ecourts: 'https://services.ecourts.gov.in',
  rtiOnline: 'https://rtionline.gov.in',
  edaakhil: 'https://edaakhil.nic.in',
  cyber: 'https://cybercrime.gov.in',
  consumerHelpline: 'https://consumerhelpline.gov.in',
};

// Problem types the agent can recognise. `keywords` drive the offline (no-LLM) classifier.
export const PROBLEMS = {
  unpaid_wages: {
    title: { en: 'Unpaid wages or salary', hi: 'मज़दूरी या वेतन नहीं मिला' },
    keywords: ['salary', 'wage', 'wages', 'not paid', 'unpaid', 'employer', 'contractor', 'मजदूरी', 'मज़दूरी', 'वेतन', 'तनख्वाह', 'पगार', 'జీతం', 'కూలి'],
    steps: [
      'Write down what you are owed: dates worked, daily or monthly rate, total due, and the employer or contractor name and address.',
      'Keep any proof: attendance register photos, WhatsApp messages, bank transfers, witnesses who worked with you.',
      'Send a short written demand to the employer (the draft below helps). Keep a copy or photo.',
      'If not paid, file a claim at your district Labour Department office (Labour Commissioner / Assistant Labour Commissioner). Filing a claim there is free.',
      'Call 15100 for free legal aid if the employer still refuses. Workers are usually eligible for free legal help.',
    ],
    helplines: ['legalAid'],
    drafts: ['wage_demand', 'legal_aid'],
    sources: [LINKS.nalsa],
  },
  consumer: {
    title: { en: 'Cheated as a consumer (product, service, refund)', hi: 'उपभोक्ता के रूप में धोखा (सामान, सेवा, रिफंड)' },
    keywords: ['refund', 'defective', 'product', 'service', 'shop', 'online order', 'warranty', 'consumer', 'insurance claim', 'रिफंड', 'खराब सामान', 'उपभोक्ता', 'दुकान', 'వస్తువు'],
    steps: [
      'Collect the bill or invoice, order screenshots, warranty card and every message with the seller.',
      'Complain to the seller in writing first and give a date to fix it (for example 15 days).',
      'Register a free grievance with the National Consumer Helpline: call 1915 or use consumerhelpline.gov.in.',
      'If still unresolved, file a complaint with the District Consumer Commission online on e-Daakhil. You can file it yourself without a lawyer. Claims up to ₹50 lakh go to the District Commission.',
      'File within 2 years of the problem arising.',
    ],
    helplines: ['consumer'],
    drafts: ['consumer_complaint'],
    sources: [LINKS.consumerHelpline, LINKS.edaakhil],
  },
  domestic_violence: {
    title: { en: 'Violence or abuse at home', hi: 'घर में हिंसा या उत्पीड़न' },
    keywords: ['husband beats', 'beats me', 'domestic violence', 'abuse', 'dowry', 'in-laws', 'hits me', 'मारपीट', 'घरेलू हिंसा', 'दहेज', 'ससुराल', 'పెళ్ళి', 'కొడతాడు'],
    urgent: true,
    steps: [
      'If you are in danger now, call 112. For support and counselling call the Women helpline 181.',
      'The Protection of Women from Domestic Violence Act, 2005 lets you ask a Magistrate for protection, residence and maintenance orders.',
      'Contact the Protection Officer of your district (through 181, the police station, or the District Legal Services Authority) to record a Domestic Incident Report.',
      'Women are eligible for free legal aid regardless of income. Call 15100 to get a free lawyer.',
      'Keep a record: dates, injuries, photos, medical reports, messages. Keep copies with someone you trust.',
    ],
    helplines: ['police', 'women', 'legalAid'],
    drafts: ['legal_aid'],
    sources: [LINKS.nalsa],
  },
  police_fir: {
    title: { en: 'Police not registering a complaint (FIR)', hi: 'पुलिस FIR दर्ज नहीं कर रही' },
    keywords: ['fir', 'police', 'complaint not registered', 'thana', 'police station', 'stolen', 'theft', 'पुलिस', 'थाना', 'एफआईआर', 'चोरी', 'పోలీస్'],
    steps: [
      'For a serious (cognizable) offence the police must register an FIR. You can file it at any police station; it can be transferred later ("Zero FIR").',
      'Ask for a free copy of the FIR after it is registered.',
      'If the station refuses, send your complaint in writing to the Superintendent of Police (section 173(4) of the Bharatiya Nagarik Suraksha Sanhita, 2023). Keep proof of sending.',
      'If that also fails, you can apply to the Magistrate (section 175(3) BNSS). Free legal aid (15100) can help you with this.',
      'For online fraud or cyber crime, call 1930 immediately and report at cybercrime.gov.in.',
    ],
    helplines: ['police', 'cyber', 'legalAid'],
    drafts: ['sp_complaint', 'legal_aid'],
    sources: [LINKS.cyber, LINKS.nalsa],
  },
  cheque_bounce: {
    title: { en: 'Cheque bounced', hi: 'चेक बाउंस' },
    keywords: ['cheque', 'check bounce', 'bounced', 'dishonour', 'चेक', 'బౌన్స్'],
    steps: [
      'Keep the bank return memo that says why the cheque was not paid.',
      'Send a written legal notice demanding payment within 30 days of receiving the return memo (section 138, Negotiable Instruments Act).',
      'The person then has 15 days to pay.',
      'If they do not pay, a complaint can be filed in the Magistrate court within one month after those 15 days end.',
      'Deadlines are strict. Get free legal help from 15100 if you are eligible.',
    ],
    helplines: ['legalAid'],
    drafts: ['legal_aid'],
    sources: [LINKS.nalsa],
  },
  government_info: {
    title: { en: 'Need information from a government office (RTI)', hi: 'सरकारी दफ़्तर से जानकारी चाहिए (RTI)' },
    keywords: ['rti', 'pension', 'ration', 'application pending', 'government office', 'status of my application', 'information', 'सूचना', 'आरटीआई', 'पेंशन', 'राशन', 'దరఖాస్తు'],
    steps: [
      'Under the Right to Information Act, 2005 you can ask any public office for information, for example the status of your pension, ration card or application.',
      'Write a short RTI application (the draft below helps). Fee is ₹10; people below the poverty line pay nothing (attach a BPL card copy).',
      'For central government offices you can file online at rtionline.gov.in. For state offices, many states have their own portal, or send it by post to the Public Information Officer.',
      'The office must reply within 30 days. If it does not, or the reply is wrong, file a first appeal within 30 days.',
    ],
    helplines: [],
    drafts: ['rti'],
    sources: [LINKS.rtiOnline],
  },
  case_status: {
    title: { en: 'Check my court case / next hearing date', hi: 'मेरे केस की स्थिति / अगली तारीख' },
    keywords: ['case status', 'hearing', 'next date', 'cnr', 'court case', 'tareekh', 'tarikh', 'तारीख', 'केस', 'अदालत', 'పేషీ', 'కేసు'],
    steps: [
      'Find the 16-character CNR number on any court paper or summons (it looks like MHAU010012342022).',
      'Open services.ecourts.gov.in, choose "Case Status", enter the CNR and the captcha. You will see the next date, the stage and orders.',
      'The free "eCourts Services" mobile app does the same and can remind you of dates.',
      'If you have no CNR, search by party name with the state, district and court complex.',
      'If you cannot afford a lawyer for your case, call 15100 for free legal aid. Many cases can also be settled faster at a Lok Adalat, where there is no court fee.',
    ],
    helplines: ['legalAid'],
    drafts: ['legal_aid'],
    sources: [LINKS.ecourts],
  },
  land_property: {
    title: { en: 'Land, house or tenancy dispute', hi: 'ज़मीन, मकान या किराये का विवाद' },
    keywords: ['land', 'property', 'tenant', 'landlord', 'rent', 'eviction', 'encroach', 'ज़मीन', 'जमीन', 'मकान', 'किराया', 'కబ్జా', 'భూమి'],
    steps: [
      'Collect papers: sale deed, land records (record of rights), tax receipts, rent agreement, receipts and photos.',
      'Get the latest land record copy from your state land records portal or the tehsil/mandal office.',
      'Many such disputes can be settled at a Lok Adalat or through mediation run by the District Legal Services Authority. There is no court fee and the settlement is final.',
      'Call 15100 to check if you qualify for a free lawyer and to ask about the next Lok Adalat.',
    ],
    helplines: ['legalAid'],
    drafts: ['legal_aid'],
    sources: [LINKS.nalsa],
  },
};

export const DISCLAIMER = {
  en: 'This is general legal information, not legal advice. For your case, talk to a lawyer. Free lawyers are available through legal aid (call 15100).',
  hi: 'यह सामान्य कानूनी जानकारी है, कानूनी सलाह नहीं। अपने मामले के लिए वकील से बात करें। मुफ़्त वकील के लिए 15100 पर कॉल करें।',
};

export function classifyOffline(text) {
  const t = ` ${String(text || '').toLowerCase()} `;
  let best = null;
  let bestScore = 0;
  for (const [id, p] of Object.entries(PROBLEMS)) {
    let score = 0;
    for (const k of p.keywords) if (matches(t, k.toLowerCase())) score += k.length > 4 ? 2 : 1;
    if (score > bestScore) { best = id; bestScore = score; }
  }
  return best;
}

// ASCII keywords match on word boundaries ("rent" must not match "parent");
// Indic keywords match as substrings because word boundaries do not apply to them.
function matches(text, keyword) {
  if (/^[\x00-\x7f]+$/.test(keyword)) {
    const esc = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${esc}\\b`).test(text);
  }
  return text.includes(keyword);
}
