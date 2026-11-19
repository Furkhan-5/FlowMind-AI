import { AgentType, LanguageCode } from '@/types';
import { getLanguageMeta, isSupportedLanguage, resolveLanguage } from './languageContextService';
import { getLocalizedAgentName, getLocalizedAgentDomain } from './translations';

export interface MultilingualPromptOptions {
  agentId: AgentType;
  userQuery: string;
  language: LanguageCode;
  toolResults?: any;
  deterministicDraft?: string;
  isSimple?: boolean;
  isFollowUp?: boolean;
  historyContext?: string;
}

const SCRIPT_INSTRUCTIONS: Record<string, {
  name: string;
  script: string;
  directive: string;
  exampleGreeting: string;
}> = {
  en: {
    name: 'English',
    script: 'Latin script',
    directive: 'Respond entirely in fluent, professional English.',
    exampleGreeting: 'Hello! I am your FlowMind AI Assistant.',
  },
  hi: {
    name: 'Hindi',
    script: 'Devanagari script (हिन्दी)',
    directive: 'Respond entirely in natural, fluent Hindi written in the Devanagari script (हिन्दी). Do not write Hindi in Latin script/Hinglish. Translate concepts clearly into natural Hindi.',
    exampleGreeting: 'नमस्ते! मैं फ्लोमाइंड AI सहायक हूँ।',
  },
  te: {
    name: 'Telugu',
    script: 'Telugu script (తెలుగు)',
    directive: 'Respond entirely in natural, fluent Telugu written in the Telugu script (తెలుగు). Do not write Telugu in English letters. Translate business explanations naturally into proper Telugu.',
    exampleGreeting: 'నమస్కారం! నేను మీ ఫ్లోమైండ్ AI సహాయకుడిని.',
  },
  ta: {
    name: 'Tamil',
    script: 'Tamil script (தமிழ்)',
    directive: 'Respond entirely in natural, fluent Tamil written in the Tamil script (தமிழ்). Do not write Tamil in English letters. Translate business explanations naturally into proper Tamil.',
    exampleGreeting: 'வணக்கம்! நான் உங்கள் ஃப்ளோமைண்ட் AI உதவியாளர்.',
  },
  kn: {
    name: 'Kannada',
    script: 'Kannada script (ಕನ್ನಡ)',
    directive: 'Respond entirely in natural, fluent Kannada written in the Kannada script (ಕನ್ನಡ). Do not write Kannada in English letters. Translate business explanations naturally into proper Kannada.',
    exampleGreeting: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಫ್ಲೋಮೈಂಡ್ AI ಸಹಾಯಕ.',
  },
  ml: {
    name: 'Malayalam',
    script: 'Malayalam script (മലയാളം)',
    directive: 'Respond entirely in natural, fluent Malayalam written in the Malayalam script (മലയാളം). Do not write Malayalam in English letters. Translate business explanations naturally into proper Malayalam.',
    exampleGreeting: 'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ ഫ്ലോമൈൻഡ് AI സഹായിയാണ്.',
  },
};

export class MultilingualPromptBuilder {
  /**
   * Builds strict language mandate instructions for system prompt
   */
  public static buildLanguageDirective(language: LanguageCode = 'en'): string {
    const lang = resolveLanguage(language);
    const info = SCRIPT_INSTRUCTIONS[lang] || SCRIPT_INSTRUCTIONS.en;

    return `
=== CRITICAL MULTILINGUAL INSTRUCTIONS (MANDATORY) ===
Target Language: ${info.name}
Required Output Script: ${info.script}
Instruction: ${info.directive}

STRICT TRANSLATION & SCRIPT RULES:
1. Native Script Requirement: If target language is ${info.name}, your ENTIRE final response (except database IDs, code, and table keys) MUST be written in ${info.script}.
2. Romanized / Mixed Input Handling: If the user query is typed in Romanized phonetic script (e.g. "entha pending unnayi", "kitne invoices hain", "evvalavu irukku", "eshtu ide"), recognize the user's intent and respond in the clean ${info.script} script of ${info.name}.
3. Entity & ID Preservation: NEVER translate, phoneticize, or mutate raw database identifiers (e.g. INV-2026-001, LEAD-01, EMP-101, PROD-01, WF-1794996706285, TICKET-101). Keep them exactly as they appear in the database.
4. Currency & Number Formatting: Keep all financial figures formatted with the '₹' symbol using Indian numbering notation (e.g. ₹8,85,000, ₹4,50,000, ₹5,31,000). Numerical digits (0-9) may remain standard Arabic numerals for clear enterprise readability.
5. Markdown Formatting: Use valid Markdown formatting with standard '###' headings, '**' bold text, '-' bullet points, and '|' Markdown tables. Do NOT escape markdown characters with backslashes.
6. Honest Grounding: Ground all statements strictly in verified operational data. Disclose missing or zero records transparently in ${info.name}.
======================================================
`.trim();
  }

  /**
   * Builds localized introductory instructions for conversational queries
   */
  public static buildSimpleGreetingInstruction(agentId: AgentType, language: LanguageCode = 'en'): string {
    const lang = resolveLanguage(language);
    const agentName = getLocalizedAgentName(agentId, lang);
    const agentDomain = getLocalizedAgentDomain(agentId, lang);
    const info = SCRIPT_INSTRUCTIONS[lang] || SCRIPT_INSTRUCTIONS.en;

    return `
You are the ${agentName} (${agentDomain}) for FlowMind AI Operating System.
The user asked a simple conversational or introductory question.
Provide a concise, helpful, and natural response in ${info.script}.
Introduce yourself as the ${agentName}, briefly state your 2-3 core business capabilities (${agentDomain}), and invite the user's query.
Do NOT invent or fabricate database records. Do NOT pad with complex report templates or empty tables.
`.trim();
  }

  /**
   * Builds the complete prompt for LLM synthesis
   */
  public static buildSynthesisPrompt(opts: MultilingualPromptOptions): string {
    const lang = resolveLanguage(opts.language);
    const info = SCRIPT_INSTRUCTIONS[lang] || SCRIPT_INSTRUCTIONS.en;
    const agentName = getLocalizedAgentName(opts.agentId, lang);

    const historySection = opts.historyContext ? `Recent Context:\n${opts.historyContext}\n\n` : '';
    const resultsStr = opts.toolResults ? JSON.stringify(opts.toolResults, null, 2) : '[]';

    return (
      `${historySection}` +
      `User Query: "${opts.userQuery}"\n` +
      `Active Agent: ${opts.agentId} Agent (${agentName})\n` +
      `Target Response Language: ${info.name} (${info.script})\n\n` +
      `Verified Operational Database Data:\n${resultsStr}\n\n` +
      `Deterministic Grounded Draft:\n${opts.deterministicDraft || 'None'}\n\n` +
      `Synthesis Task:\n` +
      (opts.isSimple
        ? `Provide a friendly, direct conversational response introducing yourself as ${agentName} in fluent ${info.script}. Do not invent database records.`
        : opts.isFollowUp
        ? `Provide a concise, direct answer to the follow-up question in fluent ${info.script}. Perform any requested calculations accurately against the verified data above.`
        : `Synthesize a structured, enterprise-ready response in fluent ${info.script}. ` +
          `Reflect ALL verified records from the data above. ` +
          `Format all currency amounts in Indian numbering with ₹ (e.g. ₹8,85,000). ` +
          `Render tables using standard Markdown. ` +
          `Write the response entirely in ${info.script}.`)
    );
  }

  /**
   * Localizes deterministic report draft baselines into target native Indic scripts,
   * preventing English leakage in case of LLM unavailability or rate limiting.
   */
  public static localizeDraft(draft: string, language: LanguageCode = 'en'): string {
    const lang = resolveLanguage(language);
    if (lang === 'en' || !draft) return draft;

    const TRANSLATION_MAPS: Record<string, [RegExp | string, string][]> = {
      hi: [
        [/###\s+Financial Overview/gi, '### वित्तीय समीक्षा (Financial Overview)'],
        [/The \*\*Finance Agent\*\* audited our PostgreSQL ledger and identified \*\*Overdue Customer Invoices\*\*/gi, '**वित्त एजेंट (Finance Agent)** ने हमारे पोस्टग्रेएसक्यूएल लेज़र का ऑडिट किया और **अतिदेय ग्राहक चालान (Overdue Customer Invoices)** की पहचान की'],
        [/###\s+Overdue Invoice Breakdown/gi, '### अतिदेय चालान विवरण (Overdue Invoice Breakdown)'],
        [/\|\s*Customer Name\s*\|\s*Overdue Count\s*\|\s*Invoice Numbers\s*\|\s*Due Date\(s\)\s*\|\s*Outstanding Balance\s*\|/gi, '| ग्राहक का नाम | अतिदेय संख्या | चालान संख्या | नियत तिथि | बकाया राशि |'],
        [/###\s+Customer-wise Outstanding Balances/gi, '### ग्राहक-वार बकाया राशि (Customer-wise Outstanding Balances)'],
        [/Accounts with active overdue balances include \*\*TechCorp India\*\* and enterprise partners under ledger governance\./gi, 'सक्रिय बकाया राशि वाले खातों में **TechCorp India** और लेज़र नियंत्रण के अंतर्गत उद्यम साझेदार शामिल हैं।'],
        [/###\s+Total Outstanding Amount:\s*\*\*₹([0-9,]+)\*\*/gi, '### कुल बकाया राशि (Total Outstanding Amount): **₹$1**'],
        [/###\s+Calculations & Audit Trail/gi, '### गणना और ऑडिट विवरण (Calculations & Audit Trail)'],
        [/Total overdue balance is computed from live database records inclusive of 18% GST \(CGST 9% \+ SGST 9%\) after deducting verified partial payments\./gi, 'सत्यापित आंशिक भुगतानों की कटौती के बाद 18% जीएसटी (सीजीएसटी 9% + एसजीएसटी 9%) सहित लाइव डेटाबेस रिकॉर्ड से कुल अतिदेय राशि की गणना की गई है।'],
        [/###\s+Collection Priorities & Recommended Actions/gi, '### वसूली प्राथमिकताएं और अनुशंसित कार्रवाइयां'],
        [/1\.\s+Issue immediate payment notices to top-exposure accounts \(\*\*TechCorp India\*\*\)\./gi, '1. शीर्ष-एक्सपोजर खातों (**TechCorp India**) को तत्काल भुगतान नोटिस जारी करें।'],
        [/2\.\s+Pause non-essential automated services until past-due obligations are settled\./gi, '2. अतिदेय देनदारियों का निपटारा होने तक गैर-आवश्यक स्वचालित सेवाओं को रोकें।'],
        [/###\s+Data Sources & Verification/gi, '### डेटा स्रोत और सत्यापन (Data Sources & Verification)'],
        [/Verified against PostgreSQL `invoices` table records\. Audited and tamper-proof\./gi, 'पोस्टग्रेएसक्यूएल `invoices` तालिका रिकॉर्ड के विरुद्ध सत्यापित। लेखापरीक्षित और सुरक्षित।'],
        [/###\s+Executive Summary/gi, '### कार्यकारी सारांश (Executive Summary)'],
        [/As the \*\*CEO Master Agent\*\*, I coordinate our 15-agent mesh across Sales, Finance, HR, Inventory, Support, and Workflow automation\./gi, '**CEO मास्टर एजेंट** के रूप में, मैं बिक्री, वित्त, मानव संसाधन, इन्वेंट्री, सहायता और वर्कफ़्लो स्वचालन में हमारे 15-एजेंट मेश का समन्वय करता हूँ।'],
        [/###\s+Cross-Departmental Performance & Risk Analysis/gi, '### अंतर-विभागीय प्रदर्शन और जोखिम विश्लेषण'],
        [/All active enterprise modules \(CRM, Finance, HR, Inventory, Support, Workflow\) are operational and connected to our live PostgreSQL database\./gi, 'सभी सक्रिय उद्यम मॉड्यूल (सीआरएम, वित्त, एचआर, इन्वेंटरी, सहायता, वर्कफ़्लो) चालू हैं और हमारे लाइव पोस्टग्रेएसक्यूएल डेटाबेस से जुड़े हैं।'],
        [/###\s+Critical Operational Risks/gi, '### महत्वपूर्ण परिचालन जोखिम (Critical Operational Risks)'],
        [/###\s+30-Day Strategic Action Plan/gi, '### 30-दिवसीय रणनीतिक कार्य योजना (30-Day Strategic Action Plan)'],
        [/###\s+Sales Pipeline Overview/gi, '### बिक्री पाइपलाइन अवलोकन (Sales Pipeline Overview)'],
        [/The \*\*Sales Agent\*\* evaluated \*\*(\d+) active opportunities\*\* in our CRM pipeline totaling \*\*₹([0-9,]+)\*\*:/gi, '**सेल्स एजेंट (Sales Agent)** ने हमारे CRM पाइपलाइन में कुल **₹$2** मूल्य वाले **$1 सक्रिय अवसरों** का मूल्यांकन किया:'],
        [/###\s+Pipeline Breakdown/gi, '### पाइपलाइन विवरण (Pipeline Breakdown)'],
        [/\|\s*Lead Name\s*\|\s*Company\s*\|\s*Stage\s*\|\s*Value\s*\|\s*Owner\s*\|\s*Status\s*\|/gi, '| लीड का नाम | कंपनी | चरण | मूल्य | स्वामी | स्थिति |'],
        [/###\s+Strongest Opportunities/gi, '### सबसे मजबूत अवसर (Strongest Opportunities)'],
        [/###\s+Recommended Actions/gi, '### अनुशंसित कार्रवाइयां (Recommended Actions)'],
        [/###\s+Key Observations/gi, '### मुख्य अवलोकन (Key Observations)'],
        [/###\s+Data Integrity/gi, '### डेटा सत्यनिष्ठा (Data Integrity)'],
        [/Sourced from PostgreSQL `leads` table\. Verified CRMLead records\./gi, 'पोस्टग्रेएसक्यूएल `leads` तालिका से प्राप्त। सत्यापित CRM रिकॉर्ड।'],
        [/###\s+👥\s+Employees on Leave Today/gi, '### 👥 आज छुट्टी पर कर्मचारी (Employees on Leave Today)'],
        [/###\s+👥\s+Active Workforce Directory/gi, '### 👥 सक्रिय कार्यबल निर्देशिका (Active Workforce Directory)'],
        [/###\s+🎫\s+Unresolved & High-Priority Support Tickets/gi, '### 🎫 अनसुलझे और उच्च-प्राथमिकता वाले सपोर्ट टिकट'],
        [/###\s+📦\s+Low Stock & Inventory Threshold Alerts/gi, '### 📦 कम स्टॉक और इन्वेंट्री थ्रेशोल्ड अलर्ट'],
        [/###\s+📊\s+Enterprise Analytics & KPI Summary/gi, '### 📊 एंटरप्राइज एनालिटिक्स और केपीआई सारांश'],
        [/###\s+🚀\s+Strategic Marketing Campaign Plan/gi, '### 🚀 रणनीतिक मार्केटिंग अभियान योजना'],
        [/###\s+🛡️\s+Enterprise Security & Governance Audit/gi, '### 🛡️ एंटरप्राइज सुरक्षा और शासन ऑडिट'],
      ],
      te: [
        [/###\s+Financial Overview/gi, '### ఆర్థిక సమీక్ష (Financial Overview)'],
        [/The \*\*Finance Agent\*\* audited our PostgreSQL ledger and identified \*\*Overdue Customer Invoices\*\*/gi, '**ఫైనాన్స్ ఏజెంట్ (Finance Agent)** మన పోస్ట్‌గ్రేఎస్క్యూఎల్ లెడ్జర్‌ను ఆడిట్ చేసి **గడువు ముగిసిన కస్టమర్ ఇన్వాయిస్‌లను (Overdue Customer Invoices)** గుర్తించారు'],
        [/###\s+Overdue Invoice Breakdown/gi, '### గడువు ముగిసిన ఇన్వాయిస్‌ల వివరాలు (Overdue Invoice Breakdown)'],
        [/\|\s*Customer Name\s*\|\s*Overdue Count\s*\|\s*Invoice Numbers\s*\|\s*Due Date\(s\)\s*\|\s*Outstanding Balance\s*\|/gi, '| కస్టమర్ పేరు | గడువు ముగిసిన సంఖ్య | ఇన్వాయిస్ నంబర్లు | గడువు తేదీ | బకాయి మొత్తం |'],
        [/###\s+Customer-wise Outstanding Balances/gi, '### కస్టమర్ల వారీగా బకాయిలు (Customer-wise Outstanding Balances)'],
        [/Accounts with active overdue balances include \*\*TechCorp India\*\* and enterprise partners under ledger governance\./gi, 'క్రియాశీల బకాయిలు ఉన్న ఖాతాలలో **TechCorp India** మరియు లెడ్జర్ నియంత్రణలో ఉన్న వ్యాపార భాగస్వాములు ఉన్నారు.'],
        [/###\s+Total Outstanding Amount:\s*\*\*₹([0-9,]+)\*\*/gi, '### మొత్తం బకాయి మొత్తం (Total Outstanding Amount): **₹$1**'],
        [/###\s+Calculations & Audit Trail/gi, '### లెక్కింపులు మరియు ఆడిట్ వివరాలు (Calculations & Audit Trail)'],
        [/Total overdue balance is computed from live database records inclusive of 18% GST \(CGST 9% \+ SGST 9%\) after deducting verified partial payments\./gi, 'ధృవీకరించబడిన పాక్షిక చెల్లింపులను మినహాయించిన తర్వాత 18% జీఎస్టీతో సహా లైవ్ డేటాబేస్ రికార్డుల నుండి మొత్తం బకాయి లెక్కించబడింది.'],
        [/###\s+Collection Priorities & Recommended Actions/gi, '### వసూలు ప్రాధాన్యతలు మరియు సిఫార్సు చేసిన చర్యలు'],
        [/1\.\s+Issue immediate payment notices to top-exposure accounts \(\*\*TechCorp India\*\*\)\./gi, '1. అత్యధిక బకాయి ఉన్న ఖాతాలకు (**TechCorp India**) వెంటనే చెల్లింపు నోటీసులను జారీ చేయండి.'],
        [/2\.\s+Pause non-essential automated services until past-due obligations are settled\./gi, '2. గడువు ముగిసిన బాధ్యతలు పరిష్కారమయ్యే వరకు అత్యవసరం కాని స్వయంచాలక సేవలను నిలిపివేయండి.'],
        [/###\s+Data Sources & Verification/gi, '### డేటా మూలాలు మరియు ధృవీకరణ (Data Sources & Verification)'],
        [/Verified against PostgreSQL `invoices` table records\. Audited and tamper-proof\./gi, 'పోస్ట్‌గ్రేఎస్క్యూఎల్ `invoices` పట్టిక రికార్డుల ఆధారంగా ధృవీకరించబడింది. ఆడిట్ చేయబడినది మరియు సురక్షితమైనది.'],
        [/###\s+Executive Summary/gi, '### కార్యనిర్వాహక సారాంశం (Executive Summary)'],
        [/As the \*\*CEO Master Agent\*\*, I coordinate our 15-agent mesh across Sales, Finance, HR, Inventory, Support, and Workflow automation\./gi, '**CEO మాస్టర్ ఏజెంట్**గా, నేను సేల్స్, ఫైనాన్స్, హెచ్‌ఆర్, ఇన్వెంటరీ, సపోర్ట్ మరియు వర్క్‌ఫ్లో ఆటోమేషన్ అంతటా మా 15-ఏజెంట్ మెష్‌ను సమన్వయం చేస్తాను.'],
        [/###\s+Cross-Departmental Performance & Risk Analysis/gi, '### శాఖల వారీ పనితీరు మరియు రిస్క్ విశ్లేషణ'],
        [/All active enterprise modules \(CRM, Finance, HR, Inventory, Support, Workflow\) are operational and connected to our live PostgreSQL database\./gi, 'అన్ని క్రియాశీల ఎంటర్‌ప్రైజ్ మాడ్యూల్స్ (CRM, ఫైనాన్స్, HR, ఇన్వెంటరీ, సపోర్ట్, వర్క్‌ఫ్లో) పని చేస్తున్నాయి మరియు లైవ్ పోస్ట్‌గ్రేఎస్క్యూఎల్ డేటాబేస్‌కు అనుసంధానించబడి ఉన్నాయి.'],
        [/###\s+Critical Operational Risks/gi, '### కీలక నిర్వహణ ప్రమాదాలు (Critical Operational Risks)'],
        [/###\s+30-Day Strategic Action Plan/gi, '### 30 రోజుల వ్యూహాత్మక కార్యాచరణ ప్రణాళిక (30-Day Strategic Action Plan)'],
        [/###\s+Sales Pipeline Overview/gi, '### అమ్మకాల పైప్‌లైన్ అవలోకనం (Sales Pipeline Overview)'],
        [/The \*\*Sales Agent\*\* evaluated \*\*(\d+) active opportunities\*\* in our CRM pipeline totaling \*\*₹([0-9,]+)\*\*:/gi, '**సేల్స్ ఏజెంట్ (Sales Agent)** మన CRM పైప్‌లైన్‌లో మొత్తం **₹$2** విలువైన **$1 క్రియాశీల అవకాశాలను** అంచనా వేశారు:'],
        [/###\s+Pipeline Breakdown/gi, '### పైప్‌లైన్ విభజన (Pipeline Breakdown)'],
        [/\|\s*Lead Name\s*\|\s*Company\s*\|\s*Stage\s*\|\s*Value\s*\|\s*Owner\s*\|\s*Status\s*\|/gi, '| లీడ్ పేరు | కంపెనీ | దశ | విలువ | యజమాని | స్థితి |'],
        [/###\s+Strongest Opportunities/gi, '### బలమైన అవకాశాలు (Strongest Opportunities)'],
        [/###\s+Recommended Actions/gi, '### సిఫార్సు చేసిన చర్యలు (Recommended Actions)'],
        [/###\s+Key Observations/gi, '### ముఖ్య గమనికలు (Key Observations)'],
        [/###\s+Data Integrity/gi, '### డేటా సమగ్రత (Data Integrity)'],
        [/Sourced from PostgreSQL `leads` table\. Verified CRMLead records\./gi, 'పోస్ట్‌గ్రేఎస్క్యూఎల్ `leads` పట్టిక నుండి తీసుకోబడింది. ధృవీకరించబడిన రికార్డులు.'],
        [/###\s+👥\s+Employees on Leave Today/gi, '### 👥 నేడు సెలవులో ఉన్న ఉద్యోగులు'],
        [/###\s+👥\s+Active Workforce Directory/gi, '### 👥 క్రియాశీల ఉద్యోగుల డైరెక్టరీ'],
        [/###\s+🎫\s+Unresolved & High-Priority Support Tickets/gi, '### 🎫 పరిష్కారం కాని అధిక ప్రాధాన్యత సపోర్ట్ టికెట్లు'],
        [/###\s+📦\s+Low Stock & Inventory Threshold Alerts/gi, '### 📦 తక్కువ స్టాక్ హెచ్చరికలు'],
        [/###\s+📊\s+Enterprise Analytics & KPI Summary/gi, '### 📊 ఎంటర్‌ప్రైజ్ అనలిటిక్స్ మరియు కెపిఐ సారాంశం'],
        [/###\s+🚀\s+Strategic Marketing Campaign Plan/gi, '### 🚀 వ్యూహాత్మక మార్కెటింగ్ ప్రచార ప్రణాళిక'],
        [/###\s+🛡️\s+Enterprise Security & Governance Audit/gi, '### 🛡️ ఎంటర్‌ప్రైజ్ సెక్యూరిటీ మరియు గవర్నెన్స్ ఆడిట్'],
      ],
      ta: [
        [/###\s+Financial Overview/gi, '### நிதி கண்ணோட்டம் (Financial Overview)'],
        [/The \*\*Finance Agent\*\* audited our PostgreSQL ledger and identified \*\*Overdue Customer Invoices\*\*/gi, '**நிதி முகவர் (Finance Agent)** நமது போஸ்ட்கிரெஸ்கியூஎல் லெட்ஜரை தணிக்கை செய்து **காலாவதியான வாடிக்கையாளர் விலைப்பட்டியல்களை (Overdue Customer Invoices)** கண்டறிந்துள்ளார்'],
        [/###\s+Overdue Invoice Breakdown/gi, '### காலாவதியான விலைப்பட்டியல் விவரம் (Overdue Invoice Breakdown)'],
        [/\|\s*Customer Name\s*\|\s*Overdue Count\s*\|\s*Invoice Numbers\s*\|\s*Due Date\(s\)\s*\|\s*Outstanding Balance\s*\|/gi, '| வாடிக்கையாளர் பெயர் | காலாவதியான எண்ணிக்கை | விலைப்பட்டியல் எண்கள் | காலக்கெடு தேதி | நிலுவைத் தொகை |'],
        [/###\s+Customer-wise Outstanding Balances/gi, '### வாடிக்கையாளர் வாரியான நிலுவைத் தொகைகள்'],
        [/Accounts with active overdue balances include \*\*TechCorp India\*\* and enterprise partners under ledger governance\./gi, 'செயலில் உள்ள நிலுவைத் தொகைகளைக் கொண்ட கணக்குகளில் **TechCorp India** மற்றும் நிறுவன பங்காளிகள் அடங்குவர்.'],
        [/###\s+Total Outstanding Amount:\s*\*\*₹([0-9,]+)\*\*/gi, '### மொத்த நிலுவைத் தொகை (Total Outstanding Amount): **₹$1**'],
        [/###\s+Calculations & Audit Trail/gi, '### கணக்கீடுகள் மற்றும் தணிக்கை விவரங்கள்'],
        [/Total overdue balance is computed from live database records inclusive of 18% GST \(CGST 9% \+ SGST 9%\) after deducting verified partial payments\./gi, 'சரிபார்க்கப்பட்ட பகுதிப் பணம் செலுத்தப்பட்டதை கழித்த பிறகு, 18% ஜிஎஸ்டி உட்பட நேரலை தரவுத்தள பதிவுகளிலிருந்து மொத்த நிலுவைத் தொகை கணக்கிடப்படுகிறது.'],
        [/###\s+Collection Priorities & Recommended Actions/gi, '### வசூல் முன்னுரிமைகள் மற்றும் பரிந்துரைக்கப்பட்ட நடவடிக்கைகள்'],
        [/1\.\s+Issue immediate payment notices to top-exposure accounts \(\*\*TechCorp India\*\*\)\./gi, '1. அதிக நிலுவை உள்ள கணக்குகளுக்கு (**TechCorp India**) உடனடியாக பணம் செலுத்தும் அறிவிப்புகளை அனுப்பவும்.'],
        [/2\.\s+Pause non-essential automated services until past-due obligations are settled\./gi, '2. நிலுவைத் தொகைகள் தீர்க்கப்படும் வரை அத்தியாவசியமற்ற சேவைகளை தற்காலிகமாக நிறுத்தவும்.'],
        [/###\s+Data Sources & Verification/gi, '### தரவு ஆதாரங்கள் மற்றும் சரிபார்ப்பு (Data Sources & Verification)'],
        [/Verified against PostgreSQL `invoices` table records\. Audited and tamper-proof\./gi, 'போஸ்ட்கிரெஸ்கியூஎல் `invoices` அட்டவணை பதிவுகளுக்கு எதிராக சரிபார்க்கப்பட்டது. தணிக்கை செய்யப்பட்டது.'],
        [/###\s+Executive Summary/gi, '### நிர்வாக சுருக்கம் (Executive Summary)'],
        [/As the \*\*CEO Master Agent\*\*, I coordinate our 15-agent mesh across Sales, Finance, HR, Inventory, Support, and Workflow automation\./gi, '**CEO முதன்மை முகவராக**, நான் விற்பனை, நிதி, மனித வளம், இருப்பு, ஆதரவு மற்றும் பணிப்பாய்வு முழுவதும் எங்கள் 15-முகவர் வலையமைப்பை ஒருங்கிணைக்கிறேன்.'],
        [/###\s+Cross-Departmental Performance & Risk Analysis/gi, '### துறை சார்ந்த செயல்திறன் மற்றும் இடர் பகுப்பாய்வு'],
        [/All active enterprise modules \(CRM, Finance, HR, Inventory, Support, Workflow\) are operational and connected to our live PostgreSQL database\./gi, 'அனைத்து நிறுவன தொகுதிகளும் செயல்படுகின்றன மற்றும் நேரடி போஸ்ட்கிரெஸ்கியூஎல் தரவுத்தளத்துடன் இணைக்கப்பட்டுள்ளன.'],
        [/###\s+Critical Operational Risks/gi, '### முக்கியமான செயல்பாட்டு அபாயங்கள் (Critical Operational Risks)'],
        [/###\s+30-Day Strategic Action Plan/gi, '### 30 நாள் உத்திசார் செயல் திட்டம் (30-Day Strategic Action Plan)'],
        [/###\s+Sales Pipeline Overview/gi, '### விற்பனை பைப்லைன் கண்ணோட்டம் (Sales Pipeline Overview)'],
        [/The \*\*Sales Agent\*\* evaluated \*\*(\d+) active opportunities\*\* in our CRM pipeline totaling \*\*₹([0-9,]+)\*\*:/gi, '**விற்பனை முகவர் (Sales Agent)** நமது CRM பைப்லைனில் மொத்தம் **₹$2** மதிப்புள்ள **$1 செயலில் உள்ள வாய்ப்புகளை** மதிப்பீடு செய்தார்:'],
        [/###\s+Pipeline Breakdown/gi, '### பைப்லைன் விவரம் (Pipeline Breakdown)'],
        [/\|\s*Lead Name\s*\|\s*Company\s*\|\s*Stage\s*\|\s*Value\s*\|\s*Owner\s*\|\s*Status\s*\|/gi, '| லீட் பெயர் | நிறுவனம் | நிலை | மதிப்பு | உரிமையாளர் | நிலை |'],
        [/###\s+Strongest Opportunities/gi, '### வலுவான வாய்ப்புகள் (Strongest Opportunities)'],
        [/###\s+Recommended Actions/gi, '### பரிந்துரைக்கப்பட்ட நடவடிக்கைகள் (Recommended Actions)'],
        [/###\s+Key Observations/gi, '### முக்கிய அவதானிப்புகள் (Key Observations)'],
        [/###\s+Data Integrity/gi, '### தரவு ஒருமைப்பாடு (Data Integrity)'],
        [/Sourced from PostgreSQL `leads` table\. Verified CRMLead records\./gi, 'போஸ்ட்கிரெஸ்கியூஎல் `leads` அட்டவணையில் இருந்து பெறப்பட்டது.'],
        [/###\s+👥\s+Employees on Leave Today/gi, '### 👥 இன்று விடுப்பில் உள்ள பணியாளர்கள்'],
        [/###\s+👥\s+Active Workforce Directory/gi, '### 👥 செயலில் உள்ள பணியாளர் அடைவு'],
        [/###\s+🎫\s+Unresolved & High-Priority Support Tickets/gi, '### 🎫 தீர்க்கப்படாத உயர் முன்னுரிமை ஆதரவு டிக்கெட்டுகள்'],
        [/###\s+📦\s+Low Stock & Inventory Threshold Alerts/gi, '### 📦 குறைந்த இருப்பு எச்சரிக்கைகள்'],
        [/###\s+📊\s+Enterprise Analytics & KPI Summary/gi, '### 📊 நிறுவன பகுப்பாய்வு மற்றும் கேபிஐ சுருக்கம்'],
        [/###\s+🚀\s+Strategic Marketing Campaign Plan/gi, '### 🚀 மூலோபாய சந்தைப்படுத்தல் பிரச்சார திட்டம்'],
        [/###\s+🛡️\s+Enterprise Security & Governance Audit/gi, '### 🛡️ நிறுவன பாதுகாப்பு மற்றும் நிர்வாக தணிக்கை'],
      ],
      kn: [
        [/###\s+Financial Overview/gi, '### ಹಣಕಾಸು ಅವಲೋಕನ (Financial Overview)'],
        [/The \*\*Finance Agent\*\* audited our PostgreSQL ledger and identified \*\*Overdue Customer Invoices\*\*/gi, '**ಹಣಕಾಸು ಏಜೆಂಟ್ (Finance Agent)** ನಮ್ಮ ಪೋಸ್ಟ್‌ಗ್ರೆಸ್‌ಕ್ಯೂಎಲ್ ಲೆಡ್ಜರ್ ಅನ್ನು ಆಡಿಟ್ ಮಾಡಿದ್ದಾರೆ ಮತ್ತು **ಅವಧಿ ಮೀರಿದ ಗ್ರಾಹಕರ ಇನ್‌ವಾಯ್ಸ್‌ಗಳನ್ನು (Overdue Customer Invoices)** ಗುರುತಿಸಿದ್ದಾರೆ'],
        [/###\s+Overdue Invoice Breakdown/gi, '### ಅವಧಿ ಮೀರಿದ ಇನ್‌ವಾಯ್ಸ್ ವಿವರಗಳು (Overdue Invoice Breakdown)'],
        [/\|\s*Customer Name\s*\|\s*Overdue Count\s*\|\s*Invoice Numbers\s*\|\s*Due Date\(s\)\s*\|\s*Outstanding Balance\s*\|/gi, '| ಗ್ರಾಹಕರ ಹೆಸರು | ಅವಧಿ ಮೀರಿದ ಸಂಖ್ಯೆ | ಇನ್‌ವಾಯ್ಸ್ ಸಂಖ್ಯೆಗಳು | ಅಂತಿಮ ದಿನಾಂಕ | ಬಾಕಿ ಮೊತ್ತ |'],
        [/###\s+Customer-wise Outstanding Balances/gi, '### ಗ್ರಾಹಕವಾರು ಬಾಕಿ ಮೊತ್ತಗಳು'],
        [/Accounts with active overdue balances include \*\*TechCorp India\*\* and enterprise partners under ledger governance\./gi, 'ಸಕ್ರಿಯ ಬಾಕಿ ಹೊಂದಿರುವ ಖಾತೆಗಳಲ್ಲಿ **TechCorp India** ಮತ್ತು ಲೆಡ್ಜರ್ ಆಡಳಿತದಲ್ಲಿರುವ ಪಾಲುದಾರರು ಸೇರಿದ್ದಾರೆ.'],
        [/###\s+Total Outstanding Amount:\s*\*\*₹([0-9,]+)\*\*/gi, '### ಒಟ್ಟು ಬಾಕಿ ಮೊತ್ತ (Total Outstanding Amount): **₹$1**'],
        [/###\s+Calculations & Audit Trail/gi, '### ಲೆಕ್ಕಾಚಾರಗಳು ಮತ್ತು ಆಡಿಟ್ ವಿವರಗಳು'],
        [/Total overdue balance is computed from live database records inclusive of 18% GST \(CGST 9% \+ SGST 9%\) after deducting verified partial payments\./gi, 'ಪರಿಶೀಲಿಸಿದ ಭಾಗಶಃ ಪಾವತಿಗಳನ್ನು ಕಡಿತಗೊಳಿಸಿದ ನಂತರ 18% ಜಿಎಸ್‌ಟಿ ಸೇರಿದಂತೆ ನೇರ ಡೇಟಾಬೇಸ್ ದಾಖಲೆಗಳಿಂದ ಒಟ್ಟು ಬಾಕಿ ಮೊತ್ತವನ್ನು ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತದೆ.'],
        [/###\s+Collection Priorities & Recommended Actions/gi, '### ಸಂಗ್ರಹಣೆ ಆದ್ಯತೆಗಳು ಮತ್ತು ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮಗಳು'],
        [/1\.\s+Issue immediate payment notices to top-exposure accounts \(\*\*TechCorp India\*\*\)\./gi, '1. ಗರಿಷ್ಠ ಬಾಕಿ ಇರುವ ಖಾತೆಗಳಿಗೆ (**TechCorp India**) ತಕ್ಷಣದ ಪಾವತಿ ನೋಟಿಸ್‌ಗಳನ್ನು ನೀಡಿ.'],
        [/2\.\s+Pause non-essential automated services until past-due obligations are settled\./gi, '2. ಬಾಕಿ ಮೊತ್ತವನ್ನು ಇತ್ಯರ್ಥಪಡಿಸುವವರೆಗೆ ಅನಿವಾರ್ಯವಲ್ಲದ ಸೇವೆಗಳನ್ನು ಸ್ಥಗಿತಗೊಳಿಸಿ.'],
        [/###\s+Data Sources & Verification/gi, '### ಡೇಟಾ ಮೂಲಗಳು ಮತ್ತು ಪರಿಶೀಲನೆ (Data Sources & Verification)'],
        [/Verified against PostgreSQL `invoices` table records\. Audited and tamper-proof\./gi, 'ಪೋಸ್ಟ್‌ಗ್ರೆಸ್‌ಕ್ಯೂಎಲ್ `invoices` ಕೋಷ್ಟಕ ದಾಖಲೆಗಳ ವಿರುದ್ಧ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.'],
        [/###\s+Executive Summary/gi, '### ಕಾರ್ಯನಿರ್ವಾಹಕ ಸಾರಾಂಶ (Executive Summary)'],
        [/As the \*\*CEO Master Agent\*\*, I coordinate our 15-agent mesh across Sales, Finance, HR, Inventory, Support, and Workflow automation\./gi, '**CEO ಮಾಸ್ಟರ್ ಏಜೆಂಟ್** ಆಗಿ, ನಾನು ಮಾರಾಟ, ಹಣಕಾಸು, ಮಾನವ ಸಂಪನ್ಮೂಲ, ದಾಸ್ತಾನು, ಬೆಂಬಲ ಮತ್ತು ವರ್ಕ್‌ಫ್ಲೋ ಆಟೊಮೇಷನ್‌ನಾದ್ಯಂತ ನಮ್ಮ 15-ಏಜೆಂಟ್ ಜಾಲವನ್ನು ಸಂಯೋಜಿಸುತ್ತೇನೆ.'],
        [/###\s+Cross-Departmental Performance & Risk Analysis/gi, '### ಇಲಾಖಾವಾರು ಕಾರ್ಯಕ್ಷಮತೆ ಮತ್ತು ಅಪಾಯದ ವಿಶ್ಲೇಷಣೆ'],
        [/All active enterprise modules \(CRM, Finance, HR, Inventory, Support, Workflow\) are operational and connected to our live PostgreSQL database\./gi, 'ಎಲ್ಲಾ ಸಕ್ರಿಯ ಎಂಟರ್‌ಪ್ರೈಸ್ ಮಾಡ್ಯೂಲ್‌ಗಳು ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿವೆ ಮತ್ತು ನಮ್ಮ ನೇರ ಡೇಟಾಬೇಸ್‌ಗೆ ಸಂಪರ್ಕಗೊಂಡಿವೆ.'],
        [/###\s+Critical Operational Risks/gi, '### ನಿರ್ಣಾಯಕ ಕಾರ್ಯಾಚರಣೆಯ ಅಪಾಯಗಳು (Critical Operational Risks)'],
        [/###\s+30-Day Strategic Action Plan/gi, '### 30 ದಿನಗಳ ಕಾರ್ಯತಂತ್ರದ ಕ್ರಿಯಾ ಯೋಜನೆ (30-Day Strategic Action Plan)'],
        [/###\s+Sales Pipeline Overview/gi, '### ಮಾರಾಟ ಪೈಪ್‌ಲೈನ್ ಅವಲೋಕನ (Sales Pipeline Overview)'],
        [/The \*\*Sales Agent\*\* evaluated \*\*(\d+) active opportunities\*\* in our CRM pipeline totaling \*\*₹([0-9,]+)\*\*:/gi, '**ಮಾರಾಟ ಏಜೆಂಟ್ (Sales Agent)** ನಮ್ಮ CRM ಪೈಪ್‌ಲೈನ್‌ನಲ್ಲಿ ಒಟ್ಟು **₹$2** ಮೌಲ್ಯದ **$1 ಸಕ್ರಿಯ ಅವಕಾಶಗಳನ್ನು** ಮೌಲ್ಯಮಾಪನ ಮಾಡಿದ್ದಾರೆ:'],
        [/###\s+Pipeline Breakdown/gi, '### ಪೈಪ್‌ಲೈನ್ ವಿವರಗಳು (Pipeline Breakdown)'],
        [/\|\s*Lead Name\s*\|\s*Company\s*\|\s*Stage\s*\|\s*Value\s*\|\s*Owner\s*\|\s*Status\s*\|/gi, '| ಲೀಡ್ ಹೆಸರು | ಕಂಪನಿ | ಹಂತ | ಮೌಲ್ಯ | ಮಾಲೀಕರು | ಸ್ಥಿತಿ |'],
        [/###\s+Strongest Opportunities/gi, '### ಪ್ರಬಲ ಅವಕಾಶಗಳು (Strongest Opportunities)'],
        [/###\s+Recommended Actions/gi, '### ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮಗಳು (Recommended Actions)'],
        [/###\s+Key Observations/gi, '### ಪ್ರಮುಖ ವೀಕ್ಷಣೆಗಳು (Key Observations)'],
        [/###\s+Data Integrity/gi, '### ಡೇಟಾ ಸಮಗ್ರತೆ (Data Integrity)'],
        [/Sourced from PostgreSQL `leads` table\. Verified CRMLead records\./gi, 'ಪೋಸ್ಟ್‌ಗ್ರೆಸ್‌ಕ್ಯೂಎಲ್ `leads` ಕೋಷ್ಟಕದಿಂದ ಪಡೆಯಲಾಗಿದೆ.'],
        [/###\s+👥\s+Employees on Leave Today/gi, '### 👥 ಇಂದು ರಜೆಯಲ್ಲಿರುವ ಉದ್ಯೋಗಿಗಳು'],
        [/###\s+👥\s+Active Workforce Directory/gi, '### 👥 ಸಕ್ರಿಯ ಉದ್ಯೋಗಿ ಡೈರೆಕ್ಟರಿ'],
        [/###\s+🎫\s+Unresolved & High-Priority Support Tickets/gi, '### 🎫 ಬಗೆಹರಿಯದ ಉನ್ನತ ಆದ್ಯತೆಯ ಬೆಂಬಲ ಟಿಕೆಟ್‌ಗಳು'],
        [/###\s+📦\s+Low Stock & Inventory Threshold Alerts/gi, '### 📦 ಕಡಿಮೆ ದಾಸ್ತಾನು ಎಚ್ಚರಿಕೆಗಳು'],
        [/###\s+📊\s+Enterprise Analytics & KPI Summary/gi, '### 📊 ಎಂಟರ್‌ಪ್ರೈಸ್ ಅನಾಲಿಟಿಕ್ಸ್ ಮತ್ತು ಕೆಪಿಐ ಸಾರಾಂಶ'],
        [/###\s+🚀\s+Strategic Marketing Campaign Plan/gi, '### 🚀 ಕಾರ್ಯತಂತ್ರದ ಮಾರ್ಕೆಟಿಂಗ್ ಅಭಿಯಾನ ಯೋಜನೆ'],
        [/###\s+🛡️\s+Enterprise Security & Governance Audit/gi, '### 🛡️ ಎಂಟರ್‌ಪ್ರೈಸ್ ಭದ್ರತೆ ಮತ್ತು ಆಡಳಿತ ಆಡಿಟ್'],
      ],
      ml: [
        [/###\s+Financial Overview/gi, '### സാമ്പത്തിക അവലോകനം (Financial Overview)'],
        [/The \*\*Finance Agent\*\* audited our PostgreSQL ledger and identified \*\*Overdue Customer Invoices\*\*/gi, '**ധനകാര്യ ഏജന്റ് (Finance Agent)** നമ്മുടെ പോസ്റ്റ്ഗ്രെഎസ്ക്യുഎൽ ലെഡ്ജർ ഓഡിറ്റ് ചെയ്യുകയും **കാലഹരണപ്പെട്ട ഉപഭോക്തൃ ഇൻവോയ്സുകൾ (Overdue Customer Invoices)** കണ്ടെത്തുകയും ചെയ്തു'],
        [/###\s+Overdue Invoice Breakdown/gi, '### കാലഹരണപ്പെട്ട ഇൻവോയ്സ് വിവരങ്ങൾ (Overdue Invoice Breakdown)'],
        [/\|\s*Customer Name\s*\|\s*Overdue Count\s*\|\s*Invoice Numbers\s*\|\s*Due Date\(s\)\s*\|\s*Outstanding Balance\s*\|/gi, '| ഉപഭോക്താവിന്റെ പേര് | കാലാവധി കഴിഞ്ഞ എണ്ണം | ഇൻവോയ്സ് നമ്പറുകൾ | അവസാന തീയതി | കുടിശ്ശിക തുക |'],
        [/###\s+Customer-wise Outstanding Balances/gi, '### ഉപഭോക്താവ് തിരിച്ചുള്ള കുടിശ്ശിക തുകകൾ'],
        [/Accounts with active overdue balances include \*\*TechCorp India\*\* and enterprise partners under ledger governance\./gi, 'സജീവ കുടിശ്ശികയുള്ള അക്കൗണ്ടുകളിൽ **TechCorp India** ഉൾപ്പെടെയുള്ള സ്ഥാപന പങ്കാളികൾ ഉൾപ്പെടുന്നു.'],
        [/###\s+Total Outstanding Amount:\s*\*\*₹([0-9,]+)\*\*/gi, '### ആകെ കുടിശ്ശിക തുക (Total Outstanding Amount): **₹$1**'],
        [/###\s+Calculations & Audit Trail/gi, '### കണക്കുകൂട്ടലുകളും ഓഡിറ്റ് വിശദാംശങ്ങളും'],
        [/Total overdue balance is computed from live database records inclusive of 18% GST \(CGST 9% \+ SGST 9%\) after deducting verified partial payments\./gi, 'സ്ഥിരീകരിച്ച ഭാഗിക പേയ്‌മെന്റുകൾ കുറച്ചതിനുശേഷം 18% ജിഎസ്ടി ഉൾപ്പെടെയുള്ള ലൈവ് ഡാറ്റാബേസ് രേഖകളിൽ നിന്നാണ് ആകെ കുടിശ്ശിക കണക്കാക്കുന്നത്.'],
        [/###\s+Collection Priorities & Recommended Actions/gi, '### പിരിവ് മുൻഗണനകളും ശുപാർശ ചെയ്യുന്ന പ്രവർത്തനങ്ങളും'],
        [/1\.\s+Issue immediate payment notices to top-exposure accounts \(\*\*TechCorp India\*\*\)\./gi, '1. ഉയർന്ന കുടിശ്ശികയുള്ള അക്കൗണ്ടുകൾക്ക് (**TechCorp India**) ഉടൻ തന്നെ പേയ്‌മെന്റ് നോട്ടീസ് നൽകുക.'],
        [/2\.\s+Pause non-essential automated services until past-due obligations are settled\./gi, '2. കുടിശ്ശികകൾ തീർപ്പാക്കുന്നതുവരെ അത്യന്താപേക്ഷിതമല്ലാത്ത സേവനങ്ങൾ നിർത്തിവയ്ക്കുക.'],
        [/###\s+Data Sources & Verification/gi, '### ഡാറ്റ ഉറവിടങ്ങളും പരിശോധനയും (Data Sources & Verification)'],
        [/Verified against PostgreSQL `invoices` table records\. Audited and tamper-proof\./gi, 'പോസ്റ്റ്ഗ്രെഎസ്ക്യുഎൽ `invoices` പട്ടിക രേഖകളുമായി ഒത്തുനോക്കി പരിശോധിച്ചു.'],
        [/###\s+Executive Summary/gi, '### എക്സിക്യൂട്ടീവ് സംഗ്രഹം (Executive Summary)'],
        [/As the \*\*CEO Master Agent\*\*, I coordinate our 15-agent mesh across Sales, Finance, HR, Inventory, Support, and Workflow automation\./gi, '**സിഇഒ മാസ്റ്റർ ഏജന്റ്** എന്ന നിലയിൽ, സെയിൽസ്, ഫിനാൻസ്, എച്ച്ആർ, ഇൻവെന്ററി, സപ്പോർട്ട്, വർക്ക്ഫ്ലോ ഓട്ടോമേഷൻ എന്നിവയിലുടനീളം ഞങ്ങളുടെ 15-ഏജന്റ് ശൃംഖലയെ ഞാൻ ഏകോപിപ്പിക്കുന്നു.'],
        [/###\s+Cross-Departmental Performance & Risk Analysis/gi, '### വകുപ്പുതല പ്രകടനവും അപകടസാധ്യത വിശകലനവും'],
        [/All active enterprise modules \(CRM, Finance, HR, Inventory, Support, Workflow\) are operational and connected to our live PostgreSQL database\./gi, 'എല്ലാ എന്റർപ്രൈസ് മൊഡ്യൂളുകളും പ്രവർത്തനക്ഷമമാണ് ഒപ്പം തത്സമയ ഡാറ്റാബേസുമായി ബന്ധിപ്പിച്ചിരിക്കുന്നു.'],
        [/###\s+Critical Operational Risks/gi, '### നിർണായക പ്രവർത്തന അപകടസാധ്യതകൾ (Critical Operational Risks)'],
        [/###\s+30-Day Strategic Action Plan/gi, '### 30 ദിവസത്തെ തന്ത്രപരമായ കർമ്മ പദ്ധതി (30-Day Strategic Action Plan)'],
        [/###\s+Sales Pipeline Overview/gi, '### വിൽപ്പന പൈപ്പ്‌ലൈൻ അവലോകനം (Sales Pipeline Overview)'],
        [/The \*\*Sales Agent\*\* evaluated \*\*(\d+) active opportunities\*\* in our CRM pipeline totaling \*\*₹([0-9,]+)\*\*:/gi, '**സെയിൽസ് ഏജന്റ് (Sales Agent)** നമ്മുടെ CRM പൈപ്പ്‌ലൈനിൽ ആകെ **₹$2** മൂല്യമുള്ള **$1 സജീവ അവസരങ്ങളെ** വിലയിരുത്തി:'],
        [/###\s+Pipeline Breakdown/gi, '### പൈപ്പ്‌ലൈൻ വിവരങ്ങൾ (Pipeline Breakdown)'],
        [/\|\s*Lead Name\s*\|\s*Company\s*\|\s*Stage\s*\|\s*Value\s*\|\s*Owner\s*\|\s*Status\s*\|/gi, '| ലീഡ് പേര് | കമ്പനി | ഘട്ടം | മൂല്യം | ഉടമ | നില |'],
        [/###\s+Strongest Opportunities/gi, '### ശക്തമായ അവസരങ്ങൾ (Strongest Opportunities)'],
        [/###\s+Recommended Actions/gi, '### ശുപാർശ ചെയ്യുന്ന പ്രവർത്തനങ്ങൾ (Recommended Actions)'],
        [/###\s+Key Observations/gi, '### പ്രധാന നിരീക്ഷണങ്ങൾ (Key Observations)'],
        [/###\s+Data Integrity/gi, '### ഡാറ്റ സമഗ്രത (Data Integrity)'],
        [/Sourced from PostgreSQL `leads` table\. Verified CRMLead records\./gi, 'പോസ്റ്റ്ഗ്രെഎസ്ക്യുഎൽ `leads` പട്ടികയിൽ നിന്ന് ലഭിച്ചത്.'],
        [/###\s+👥\s+Employees on Leave Today/gi, '### 👥 ഇന്ന് അവധിയിലുള്ള ജീവനക്കാർ'],
        [/###\s+👥\s+Active Workforce Directory/gi, '### 👥 സജീവ വർക്ക്ഫോഴ്സ് ഡയറക്ടറി'],
        [/###\s+🎫\s+Unresolved & High-Priority Support Tickets/gi, '### 🎫 പരിഹരിക്കപ്പെടാത്ത ഉയർന്ന മുൻഗണന സപ്പോർട്ട് ടിക്കറ്റുകൾ'],
        [/###\s+📦\s+Low Stock & Inventory Threshold Alerts/gi, '### 📦 കുറഞ്ഞ സ്റ്റോക്ക് മുന്നറിയിപ്പുകൾ'],
        [/###\s+📊\s+Enterprise Analytics & KPI Summary/gi, '### 📊 എന്റർപ്രൈസ് അനലിറ്റിക്സും കെപിഐ സംഗ്രഹവും'],
        [/###\s+🚀\s+Strategic Marketing Campaign Plan/gi, '### 🚀 തന്ത്രപരമായ മാർക്കറ്റിംഗ് കാമ്പെയ്ൻ പ്ലാൻ'],
        [/###\s+🛡️\s+Enterprise Security & Governance Audit/gi, '### 🛡️ എന്റർപ്രൈസ് സുരക്ഷയും ഭരണ ഓഡിറ്റും'],
      ],
    };

    const rules = TRANSLATION_MAPS[lang];
    if (!rules) return draft;

    let localized = draft;
    for (const [pattern, replacement] of rules) {
      localized = localized.replace(pattern, replacement);
    }
    return localized;
  }
}

export const multilingualPromptBuilder = MultilingualPromptBuilder;
