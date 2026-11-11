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
    title: { en: 'Unpaid wages or salary', hi: 'मज़दूरी या वेतन नहीं मिला', te: 'జీతం / కూలి చెల్లించలేదు' },
    keywords: ['salary', 'wage', 'wages', 'not paid', 'unpaid', 'employer', 'contractor', 'मजदूरी', 'मज़दूरी', 'वेतन', 'तनख्वाह', 'पगार', 'జీతం', 'కూలి', 'వేతనం', 'యజమాని'],
    steps: {
      en: [
        'Write down what you are owed: dates worked, daily or monthly rate, total due, and the employer or contractor name and address.',
        'Keep any proof: attendance register photos, WhatsApp messages, bank transfers, witnesses who worked with you.',
        'Send a short written demand to the employer (the draft below helps). Keep a copy or photo.',
        'If not paid, file a claim at your district Labour Department office (Labour Commissioner / Assistant Labour Commissioner). Filing a claim there is free.',
        'Call 15100 for free legal aid if the employer still refuses. Workers are usually eligible for free legal help.',
      ],
      hi: [
        'आपके बकाया का लिखित हिसाब बनाएं: कब काम किया, दिन/महीने की दर, कुल राशि, और नियोक्ता का नाम व पता।',
        'कोई भी सबूत रखें: हाजिरी की पंक्तियों की फोटो, व्हाट्सएप संदेश, बैंक ट्रांज़ैक्शन, साथ काम करने वाले गवाह।',
        'नियोक्ता को एक संक्षिप्त लिखित मांग भेजें (नीचे ड्राफ्ट मदद करेगा)। एक प्रति रखें।',
        'यदि भुगतान नहीं होता, तो अपने ज़िला श्रम विभाग में दावा दर्ज करें (श्रम आयुक्त/सहायक श्रम आयुक्त)। दावा मुफ्त है।',
        'यदि नियोक्ता इनकार करे, तो 15100 पर कॉल कर मुफ्त कानूनी सहायता पाएं। कामगार अक्सर पात्र होते हैं।',
      ],
      te: [
        'మీకు రావాల్సిన దాని వివరాలు రాసుకోండి: పని చేసిన తేదీలు, రోజు లేదా నెల కూలి రేటు, మొత్తం బకాయి, యజమాని లేదా కాంట్రాక్టర్ పేరు, చిరునామా.',
        'ఆధారాలన్నీ దాచుకోండి: హాజరు రిజిస్టర్ ఫోటోలు, WhatsApp మెసేజ్‌లు, బ్యాంక్ బదిలీలు, మీతో కలిసి పనిచేసిన సాక్షులు.',
        'యజమానికి చిన్న లిఖిత డిమాండ్ లేఖ పంపండి (కింద ఉన్న డ్రాఫ్ట్ సహాయపడుతుంది). దాని కాపీ లేదా ఫోటో ఉంచుకోండి.',
        'అయినా చెల్లించకపోతే, మీ జిల్లా కార్మిక శాఖ కార్యాలయంలో (లేబర్ కమిషనర్ / అసిస్టెంట్ లేబర్ కమిషనర్) క్లెయిమ్ దాఖలు చేయండి. అక్కడ క్లెయిమ్ దాఖలు చేయడం ఉచితం.',
        'యజమాని ఇంకా నిరాకరిస్తే, ఉచిత న్యాయ సహాయం కోసం 15100కు కాల్ చేయండి. కార్మికులు సాధారణంగా ఉచిత న్యాయ సహాయానికి అర్హులు.',
      ],
    },
    helplines: ['legalAid'],
    drafts: ['wage_demand', 'legal_aid'],
    sources: [LINKS.nalsa],
  },
  consumer: {
    title: { en: 'Cheated as a consumer (product, service, refund)', hi: 'उपभोक्ता के रूप में धोखा (सामान, सेवा, रिफंड)', te: 'వినియోగదారుగా మోసపోయారు (వస్తువు, సేవ, రిఫండ్)' },
    keywords: ['refund', 'defective', 'product', 'service', 'shop', 'online order', 'warranty', 'consumer', 'insurance claim', 'रिफंड', 'खराब सामान', 'उपभोक्ता', 'दुकान', 'రిఫండ్', 'వస్తువు', 'దుకాణం', 'మోసపోయ'],
    steps: {
      en: [
        'Collect the bill or invoice, order screenshots, warranty card and every message with the seller.',
        'Complain to the seller in writing first and give a date to fix it (for example 15 days).',
        'Register a free grievance with the National Consumer Helpline: call 1915 or use consumerhelpline.gov.in.',
        'If still unresolved, file a complaint with the District Consumer Commission online on e-Daakhil. You can file it yourself without a lawyer. Claims up to ₹50 lakh go to the District Commission.',
        'File within 2 years of the problem arising.',
      ],
      hi: [
        'बिल या रसीद, ऑर्डर स्क्रीनशॉट, वारंटी कार्ड और विक्रेता के साथ हर संदेश इकट्ठा करें।',
        'पहले विक्रेता को लिखित में शिकायत करें और ठीक करने की तारीख दें (उदा. 15 दिन)।',
        'राष्ट्रव्यापी नेशनल कंज्यूमर हेल्पलाइन पर मुफ्त शिकायत दर्ज कराएँ: 1915 पर कॉल या consumerhelpline.gov.in का उपयोग करें।',
        'यदि फिर भी हल न हो, तो e-Daakhil पर जिले के कंज्यूमर कमीशन में शिकायत दर्ज करें। आप बिना वकील के खुद फाइल कर सकते हैं। ₹50 लाख तक के दावे जिला आयोग में जाते हैं।',
        'समस्या के उत्पन्न होने के 2 वर्षों के भीतर फाइल करें।',
      ],
      te: [
        'బిల్లు లేదా ఇన్వాయిస్, ఆర్డర్ స్క్రీన్‌షాట్‌లు, వారంటీ కార్డు, అమ్మినవారితో జరిగిన ప్రతి మెసేజ్ సేకరించండి.',
        'ముందుగా అమ్మినవారికి లిఖితంగా ఫిర్యాదు చేసి, సరిచేయడానికి ఒక గడువు ఇవ్వండి (ఉదాహరణకు 15 రోజులు).',
        'నేషనల్ కన్స్యూమర్ హెల్ప్‌లైన్‌లో ఉచితంగా ఫిర్యాదు నమోదు చేయండి: 1915కు కాల్ చేయండి లేదా consumerhelpline.gov.in వాడండి.',
        'అయినా పరిష్కారం కాకపోతే, e-Daakhil ద్వారా ఆన్‌లైన్‌లో జిల్లా వినియోగదారుల కమిషన్‌లో ఫిర్యాదు చేయండి. న్యాయవాది లేకుండా మీరే దాఖలు చేయవచ్చు. ₹50 లక్షల వరకు క్లెయిమ్‌లు జిల్లా కమిషన్‌కు వెళ్తాయి.',
        'సమస్య తలెత్తిన 2 సంవత్సరాల లోపు ఫిర్యాదు చేయండి.',
      ],
    },
    helplines: ['consumer'],
    drafts: ['consumer_complaint'],
    sources: [LINKS.consumerHelpline, LINKS.edaakhil],
  },
  domestic_violence: {
    title: { en: 'Violence or abuse at home', hi: 'घर में हिंसा या उत्पीड़न', te: 'ఇంట్లో హింస లేదా వేధింపులు' },
    keywords: ['husband beats', 'beats me', 'domestic violence', 'abuse', 'dowry', 'in-laws', 'hits me', 'मारपीट', 'घरेलू हिंसा', 'दहेज', 'ससुराल', 'కొడతాడు', 'కొడుతున్నాడు', 'గృహ హింస', 'వరకట్నం', 'అత్తమామలు', 'వేధింపు'],
    urgent: true,
    steps: {
      en: [
        'If you are in danger now, call 112. For support and counselling call the Women helpline 181.',
        'The Protection of Women from Domestic Violence Act, 2005 lets you ask a Magistrate for protection, residence and maintenance orders.',
        'Contact the Protection Officer of your district (through 181, the police station, or the District Legal Services Authority) to record a Domestic Incident Report.',
        'Women are eligible for free legal aid regardless of income. Call 15100 to get a free lawyer.',
        'Keep a record: dates, injuries, photos, medical reports, messages. Keep copies with someone you trust.',
      ],
      hi: [
        'अगर आप अभी ख़तरे में हैं, तो 112 पर कॉल करें। समर्थन और सलाह के लिए महिला हेल्पलाइन 181 पर कॉल करें।',
        'महिला संरक्षण अधिनियम, 2005 के तहत आप मजिस्ट्रेट से सुरक्षा, निवास और भरण-पोषण के आदेश माँग सकते हैं।',
        'अपने जिले के प्रोटेक्शन ऑफिसर से संपर्क करें (181, पुलिस थाना, या जिलाका विधिक सेवा प्राधिकरण) ताकि डोमेस्टिक इंस्टैंस रिपोर्ट दर्ज हो।',
        'महिलाएँ आय की परवाह किए बिना मुफ़्त कानूनी सहायता के पात्र हैं। मुफ़्त वकील के लिए 15100 पर कॉल करें।',
        'रिकॉर्ड रखें: तारीखें, चोटें, फोटो, मेडिकल रिपोर्ट, संदेश। किसी भरोसेमंद के पास कॉपी रखें।',
      ],
      te: [
        'మీరు ఇప్పుడు ప్రమాదంలో ఉంటే 112కు కాల్ చేయండి. సహాయం, కౌన్సెలింగ్ కోసం మహిళా హెల్ప్‌లైన్ 181కు కాల్ చేయండి.',
        'గృహ హింస నుండి మహిళల రక్షణ చట్టం, 2005 ప్రకారం మీరు రక్షణ, నివాసం, భరణం ఉత్తర్వుల కోసం మేజిస్ట్రేట్‌ను అడగవచ్చు.',
        'గృహ హింస సంఘటన నివేదిక (Domestic Incident Report) నమోదు చేయించడానికి మీ జిల్లా రక్షణ అధికారిని (Protection Officer) 181, పోలీస్ స్టేషన్ లేదా జిల్లా న్యాయ సేవల అధికార సంస్థ ద్వారా సంప్రదించండి.',
        'ఆదాయంతో సంబంధం లేకుండా మహిళలు ఉచిత న్యాయ సహాయానికి అర్హులు. ఉచిత న్యాయవాది కోసం 15100కు కాల్ చేయండి.',
        'రికార్డు ఉంచుకోండి: తేదీలు, గాయాలు, ఫోటోలు, వైద్య నివేదికలు, మెసేజ్‌లు. వాటి కాపీలు మీరు నమ్మే వ్యక్తి దగ్గర ఉంచండి.',
      ],
    },
    helplines: ['police', 'women', 'legalAid'],
    drafts: ['legal_aid'],
    sources: [LINKS.nalsa],
  },
  police_fir: {
    title: { en: 'Police not registering a complaint (FIR)', hi: 'पुलिस FIR दर्ज नहीं कर रही', te: 'పోలీసులు FIR నమోదు చేయడం లేదు' },
    keywords: ['fir', 'police', 'complaint not registered', 'thana', 'police station', 'stolen', 'theft', 'पुलिस', 'थाना', 'एफआईआर', 'चोरी', 'పోలీస్', 'పోలీసు', 'స్టేషన్'],
    steps: {
      en: [
        'For a serious (cognizable) offence the police must register an FIR. You can file it at any police station; it can be transferred later ("Zero FIR").',
        'Ask for a free copy of the FIR after it is registered.',
        'If the station refuses, send your complaint in writing to the Superintendent of Police (section 173(4) of the Bharatiya Nagarik Suraksha Sanhita, 2023). Keep proof of sending.',
        'If that also fails, you can apply to the Magistrate (section 175(3) BNSS). Free legal aid (15100) can help you with this.',
        'For online fraud or cyber crime, call 1930 immediately and report at cybercrime.gov.in.',
      ],
      hi: [
        'गंभीर अपराधों के लिए पुलिस को FIR दर्ज करनी ही चाहिए। आप किसी भी थाना में शिकायत दर्ज करा सकते हैं; बाद में इसे ट्रांसफर किया जा सकता है ("ज़ीरो FIR").',
        'FIR दर्ज होने के बाद उसकी एक मुफ्त प्रति माँगें।',
        'अगर थाना मना करे, तो अपनी शिकायत सुपरिंटेंडेंट ऑफ पुलिस को लिखित भेजें (Bharatiya Nagarik Suraksha Sanhita, 2023 की धारा 173(4)). भेजने का प्रमाण रखें।',
        'यदि वह भी नाकाम रहे, तो आप मजिस्ट्रेट के पास अपील कर सकते हैं (धारा 175(3) BNSS)। मुफ़्त कानूनी सहायता (15100) मदद कर सकती है।',
        'ऑनलाइन धोखाधड़ी या साइबर क्राइम के लिए तुरंत 1930 पर कॉल करें और cybercrime.gov.in पर रिपोर्ट करें।',
      ],
      te: [
        'తీవ్రమైన (కాగ్నిజబుల్) నేరానికి పోలీసులు తప్పనిసరిగా FIR నమోదు చేయాలి. మీరు ఏ పోలీస్ స్టేషన్‌లోనైనా ఫిర్యాదు చేయవచ్చు; తర్వాత దాన్ని సంబంధిత స్టేషన్‌కు బదిలీ చేస్తారు ("జీరో FIR").',
        'FIR నమోదైన తర్వాత దాని కాపీని ఉచితంగా అడిగి తీసుకోండి.',
        'స్టేషన్ నిరాకరిస్తే, మీ ఫిర్యాదును లిఖితంగా జిల్లా పోలీసు సూపరింటెండెంట్ (SP)కు పంపండి (భారతీయ నాగరిక్ సురక్షా సంహిత, 2023 సెక్షన్ 173(4)). పంపినట్లు రుజువు ఉంచుకోండి.',
        'అది కూడా ఫలించకపోతే, మీరు మేజిస్ట్రేట్‌కు దరఖాస్తు చేయవచ్చు (BNSS సెక్షన్ 175(3)). ఉచిత న్యాయ సహాయం (15100) ఇందులో మీకు సహాయపడుతుంది.',
        'ఆన్‌లైన్ మోసం లేదా సైబర్ నేరమైతే వెంటనే 1930కు కాల్ చేసి, cybercrime.gov.in లో ఫిర్యాదు చేయండి.',
      ],
    },
    helplines: ['police', 'cyber', 'legalAid'],
    drafts: ['sp_complaint', 'legal_aid'],
    sources: [LINKS.cyber, LINKS.nalsa],
  },
  cheque_bounce: {
    title: { en: 'Cheque bounced', hi: 'चेक बाउंस', te: 'చెక్ బౌన్స్ అయింది' },
    keywords: ['cheque', 'check bounce', 'bounced', 'dishonour', 'चेक', 'చెక్', 'బౌన్స్'],
    steps: {
      en: [
        'Keep the bank return memo that says why the cheque was not paid.',
        'Send a written legal notice demanding payment within 30 days of receiving the return memo (section 138, Negotiable Instruments Act).',
        'The person then has 15 days to pay.',
        'If they do not pay, a complaint can be filed in the Magistrate court within one month after those 15 days end.',
        'Deadlines are strict. Get free legal help from 15100 if you are eligible.',
      ],
      hi: [
        'बैंक की वह रसीद रखें जिसमें बताया गया हो कि चेक क्यों न भुगतान हुआ।',
        'रिटर्न मेमो मिलने के 30 दिनों के भीतर भुगतान की मांग वाला लिखित नोटिस भेजें (सेक्शन 138, नेगोशिएबल इंस्ट्रुमेंट्स एक्ट)।',
        'उसके बाद 15 दिन का समय मिलता है।',
        'अगर भुगतान नहीं होता, तो उन 15 दिनों के बाद एक महीने के भीतर मजिस्ट्रेट कोर्ट में शिकायत कर सकते हैं।',
        'समय सीमा सख्त है। अगर आप पात्र हैं तो 15100 से मुफ्त कानूनी मदद लें।',
      ],
      te: [
        'చెక్ ఎందుకు చెల్లించలేదో తెలిపే బ్యాంక్ రిటర్న్ మెమో దాచుకోండి.',
        'రిటర్న్ మెమో అందిన 30 రోజుల లోపు, డబ్బు చెల్లించమని లిఖిత లీగల్ నోటీసు పంపండి (నెగోషియబుల్ ఇన్‌స్ట్రుమెంట్స్ చట్టం, సెక్షన్ 138).',
        'ఆ తర్వాత ఆ వ్యక్తికి చెల్లించడానికి 15 రోజుల గడువు ఉంటుంది.',
        'వారు చెల్లించకపోతే, ఆ 15 రోజులు ముగిసిన తర్వాత ఒక నెల లోపు మేజిస్ట్రేట్ కోర్టులో ఫిర్యాదు దాఖలు చేయవచ్చు.',
        'గడువులు కఠినంగా ఉంటాయి. మీరు అర్హులైతే 15100 ద్వారా ఉచిత న్యాయ సహాయం పొందండి.',
      ],
    },
    helplines: ['legalAid'],
    drafts: ['legal_aid'],
    sources: [LINKS.nalsa],
  },
  government_info: {
    title: { en: 'Need information from a government office (RTI)', hi: 'सरकारी दफ़्तर से जानकारी चाहिए (RTI)', te: 'ప్రభుత్వ కార్యాలయం నుండి సమాచారం కావాలి (RTI)' },
    keywords: ['rti', 'pension', 'ration', 'application pending', 'government office', 'status of my application', 'information', 'सूचना', 'आरटीआई', 'पेंशन', 'राशन', 'సమాచారం', 'దరఖాస్తు', 'పెన్షన్', 'రేషన్'],
    steps: {
      en: [
        'Under the Right to Information Act, 2005 you can ask any public office for information, for example the status of your pension, ration card or application.',
        'Write a short RTI application (the draft below helps). Fee is ₹10; people below the poverty line pay nothing (attach a BPL card copy).',
        'For central government offices you can file online at rtionline.gov.in. For state offices, many states have their own portal, or send it by post to the Public Information Officer.',
        'The office must reply within 30 days. If it does not, or the reply is wrong, file a first appeal within 30 days.',
      ],
      hi: [
        'सूचना के अधिकार अधिनियम, 2005 के तहत आप किसी सार्वजनिक कार्यालय से जानकारी माँग सकते हैं, जैसे आपकी पेंशन या राशन कार्ड की स्थिति।',
        'एक छोटा RTI आवेदन लिखें (नीचे ड्राफ्ट मदद करेगा)। शुल्क ₹10 है; गरीबी रेखा के नीचे के लोगों को कोई शुल्क नहीं देना होता (BPL कार्ड की प्रति लगाएँ)।',
        'केंद्रीय कार्यालयों के लिए rtionline.gov.in पर ऑनलाइन फाइल करें। राज्य कार्यालयों के लिए कई राज्यों के अपने पोर्टल हैं, या सार्वजनिक सूचना अधिकारी को डाक करें।',
        'कार्यालय को 30 दिनों में उत्तर देना होगा। यदि नहीं या उत्तर गलत है तो पहले अपील 30 दिनों में दाखिल करें।',
      ],
      te: [
        'సమాచార హక్కు చట్టం, 2005 ప్రకారం మీరు ఏ ప్రభుత్వ కార్యాలయాన్నైనా సమాచారం అడగవచ్చు, ఉదాహరణకు మీ పెన్షన్, రేషన్ కార్డు లేదా దరఖాస్తు స్థితి.',
        'చిన్న RTI దరఖాస్తు రాయండి (కింద ఉన్న డ్రాఫ్ట్ సహాయపడుతుంది). ఫీజు ₹10; దారిద్ర్య రేఖకు దిగువన ఉన్నవారు ఏమీ చెల్లించనక్కర్లేదు (BPL కార్డు కాపీ జత చేయండి).',
        'కేంద్ర ప్రభుత్వ కార్యాలయాలకు rtionline.gov.in లో ఆన్‌లైన్‌లో దాఖలు చేయవచ్చు. రాష్ట్ర కార్యాలయాలకు చాలా రాష్ట్రాలకు సొంత పోర్టల్ ఉంది, లేదా పౌర సమాచార అధికారికి (PIO) పోస్టులో పంపండి.',
        'కార్యాలయం 30 రోజుల లోపు జవాబివ్వాలి. ఇవ్వకపోతే, లేదా జవాబు తప్పుగా ఉంటే, 30 రోజుల లోపు మొదటి అప్పీల్ దాఖలు చేయండి.',
      ],
    },
    helplines: [],
    drafts: ['rti'],
    sources: [LINKS.rtiOnline],
  },
  case_status: {
    title: { en: 'Check my court case / next hearing date', hi: 'मेरे केस की स्थिति / अगली तारीख', te: 'నా కోర్టు కేసు స్థితి / తదుపరి వాయిదా తేదీ' },
    keywords: ['case status', 'hearing', 'next date', 'cnr', 'court case', 'tareekh', 'tarikh', 'तारीख', 'केस', 'अदालत', 'కేసు', 'వాయిదా', 'కోర్టు'],
    steps: {
      en: [
        'Find the 16-character CNR number on any court paper or summons (it looks like MHAU010012342022).',
        'Open services.ecourts.gov.in, choose "Case Status", enter the CNR and the captcha. You will see the next date, the stage and orders.',
        'The free "eCourts Services" mobile app does the same and can remind you of dates.',
        'If you have no CNR, search by party name with the state, district and court complex.',
        'If you cannot afford a lawyer for your case, call 15100 for free legal aid. Many cases can also be settled faster at a Lok Adalat, where there is no court fee.',
      ],
      hi: [
        'Find the 16-character CNR number on any court paper or summons (it looks like MHAU010012342022).',
        'Open services.ecourts.gov.in, choose "Case Status", enter the CNR and the captcha. You will see the next date, the stage and orders.',
        'The free "eCourts Services" mobile app does the same and can remind you of dates.',
        'If you have no CNR, search by party name with the state, district and court complex.',
        'If you cannot afford a lawyer for your case, call 15100 for free legal aid. Many cases can also be settled faster at a Lok Adalat, where there is no court fee.',
      ],
      te: [
        'ఏదైనా కోర్టు కాగితం లేదా సమన్లపై ఉండే 16 అక్షరాల CNR నంబర్ కనుగొనండి (ఇది MHAU010012342022 లా ఉంటుంది).',
        'services.ecourts.gov.in తెరిచి, "Case Status" ఎంచుకుని, CNR, క్యాప్చా నమోదు చేయండి. తదుపరి తేదీ, కేసు దశ, ఉత్తర్వులు కనిపిస్తాయి.',
        'ఉచిత "eCourts Services" మొబైల్ యాప్ కూడా ఇదే పని చేస్తుంది, తేదీలను గుర్తు చేస్తుంది.',
        'CNR లేకపోతే, రాష్ట్రం, జిల్లా, కోర్టు కాంప్లెక్స్ ఎంచుకుని కక్షిదారు పేరుతో వెతకండి.',
        'మీ కేసుకు న్యాయవాదిని పెట్టుకునే స్థోమత లేకపోతే, ఉచిత న్యాయ సహాయం కోసం 15100కు కాల్ చేయండి. చాలా కేసులు కోర్టు ఫీజు లేని లోక్ అదాలత్‌లో త్వరగా పరిష్కారమవుతాయి.',
      ],
    },
    helplines: ['legalAid'],
    drafts: ['legal_aid'],
    sources: [LINKS.ecourts],
  },
  land_property: {
    title: { en: 'Land, house or tenancy dispute', hi: 'ज़मीन, मकान या किराये का विवाद', te: 'భూమి, ఇల్లు లేదా అద్దె వివాదం' },
    keywords: ['land', 'property', 'tenant', 'landlord', 'rent', 'eviction', 'encroach', 'ज़मीन', 'जमीन', 'मकान', 'किराया', 'కబ్జా', 'భూమి', 'ఇల్లు', 'అద్దె'],
    steps: {
      en: [
        'Collect papers: sale deed, land records (record of rights), tax receipts, rent agreement, receipts and photos.',
        'Get the latest land record copy from your state land records portal or the tehsil/mandal office.',
        'Many such disputes can be settled at a Lok Adalat or through mediation run by the District Legal Services Authority. There is no court fee and the settlement is final.',
        'Call 15100 to check if you qualify for a free lawyer and to ask about the next Lok Adalat.',
      ],
      hi: [
        'कागज़ात इकट्ठा करें: बिक्री पत्र, जमीन के रिकॉर्ड (राइट्स रिकॉर्ड), कर रसीदें, किराये का समझौता, रसीदें और तस्वीरें।',
        'अपने राज्य के जमीन रिकॉर्ड पोर्टल या तहसील/मंडल कार्यालय से नवीनतम रिकॉर्ड की प्रति प्राप्त करें।',
        'ऐसी कई विवादें लोक अदालत में निपटाई जा सकती हैं या जिला विधिक सेवा प्राधिकरण की मध्यस्थता से सुलझ सकती हैं। कोई कोर्ट फीस नहीं और समझौता अंतिम होता है।',
        'जांच करने के लिए 15100 पर कॉल करें कि क्या आप मुफ्त वकील के लिए पात्र हैं और अगले लोक अदालत के बारे में पूछें।',
      ],
      te: [
        'కాగితాలు సేకరించండి: సేల్ డీడ్ (అమ్మకపు దస్తావేజు), భూ రికార్డులు (హక్కుల రికార్డు / పహాణీ), పన్ను రసీదులు, అద్దె ఒప్పందం, రసీదులు, ఫోటోలు.',
        'మీ రాష్ట్ర భూ రికార్డుల పోర్టల్ నుండి లేదా తహసీల్ / మండల కార్యాలయం నుండి తాజా భూ రికార్డు కాపీ తీసుకోండి.',
        'ఇలాంటి చాలా వివాదాలు లోక్ అదాలత్‌లో లేదా జిల్లా న్యాయ సేవల అధికార సంస్థ నిర్వహించే మధ్యవర్తిత్వం ద్వారా పరిష్కారమవుతాయి. కోర్టు ఫీజు ఉండదు, పరిష్కారం అంతిమమైనది.',
        'ఉచిత న్యాయవాదికి మీరు అర్హులో కాదో తెలుసుకోవడానికి, తదుపరి లోక్ అదాలత్ గురించి అడగడానికి 15100కు కాల్ చేయండి.',
      ],
    },
    helplines: ['legalAid'],
    drafts: ['legal_aid'],
    sources: [LINKS.nalsa],
  },
};

export const DISCLAIMER = {
  en: 'This is general legal information, not legal advice. For your case, talk to a lawyer. Free lawyers are available through legal aid (call 15100).',
  hi: 'यह सामान्य कानूनी जानकारी है, कानूनी सलाह नहीं। अपने मामले के लिए वकील से बात करें। मुफ़्त वकील के लिए 15100 पर कॉल करें।',
  te: 'ఇది సాధారణ న్యాయ సమాచారం మాత్రమే, న్యాయ సలహా కాదు. మీ కేసు గురించి న్యాయవాదితో మాట్లాడండి. ఉచిత న్యాయవాది కోసం 15100కు కాల్ చేయండి.',
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
