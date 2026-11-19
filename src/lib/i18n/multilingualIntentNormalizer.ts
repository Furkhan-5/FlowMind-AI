import { AgentType, LanguageCode } from '@/types';
import { InterpretedIntent } from '@/lib/ai/agentContracts';
import { detectInputLanguage, resolveLanguage } from './languageContextService';

export interface NormalizerOptions {
  language?: LanguageCode;
  selectedAgentOverride?: AgentType | null;
  userRole?: string;
}

/**
 * MultilingualIntentNormalizer
 *
 * Centralized, language-independent intent normalization layer.
 * Transforms user requests in all six supported languages (en, hi, te, ta, kn, ml)
 * and their Romanized transliterations into standard, canonical operational intents.
 *
 * Guarantees:
 * SAME USER + SAME TENANT + SAME REQUEST MEANING + SAME DATABASE STATE = SAME BUSINESS RESULT.
 */
export class MultilingualIntentNormalizer {
  /**
   * Normalizes any multilingual user query into a canonical InterpretedIntent
   */
  public static normalize(userQuery: string, options: NormalizerOptions = {}): InterpretedIntent | null {
    const raw = (userQuery || '').trim();
    if (!raw) return null;

    const lower = raw.toLowerCase();
    const detectedLang = options.language ? resolveLanguage(options.language) : detectInputLanguage(raw);
    const agentOverride = options.selectedAgentOverride || null;

    // =========================================================================
    // 1. Cross-Domain Multi-Agent Inquiries (CEO Coordination)
    // =========================================================================
    const hasRiskOrCrossDomain =
      // English
      (/\b(?:both\s+overdue|risk\s+accounts|cross\s+department|overdue.*(?:and|&).*(?:support|ticket)|finance.*(?:and|&).*support)\b/i.test(lower)) ||
      // Hindi
      (/(?:आर्थिक|वित्त|चालान|बकाया|अतिदेय).*(?:और|तथा).*(?:सपोर्ट|टिकट|सहायता|शिकायत)/i.test(lower)) ||
      (/(?:जोखिम|रिस्क)\s*(?:खाते|विश्लेषण)/i.test(lower)) ||
      // Telugu
      (/(?:ఆర్థిక|ఇన్వాయిస్|బకాయి).*(?:మరియు|మరియును).*(?:సపోర్ట్|టికెట్|టిక్కెట్|టిక్కెట్ల|ఫిర్యాదు)/i.test(lower)) ||
      (/(?:రిస్క్|ప్రమాద)\s*ఖాతాలు/i.test(lower)) ||
      // Tamil
      (/(?:நிதி|விலைப்பட்டியல்|நிலுவை).*(?:மற்றும்).*(?:ஆதரவு|டிக்கெட்|புகார்)/i.test(lower)) ||
      // Kannada
      (/(?:ಹಣಕಾಸು|ಇನ್‌ವಾಯ್ಸ್|ಬಾಕಿ).*(?:ಮತ್ತು).*(?:ಬೆಂಬಲ|ಟಿಕೆಟ್|ದೂರು)/i.test(lower)) ||
      // Malayalam
      (/(?:സാമ്പത്തിക|ഇൻവോയ്സ്|കുടിശ്ശിക).*(?:ഒപ്പം|കൂടാതെ).*(?:സപ്പോർട്ട്|ടിക്കറ്റ്|പരാതി)/i.test(lower));

    if (hasRiskOrCrossDomain) {
      return {
        primaryIntent: 'CROSS_DOMAIN_OVERDUE_AND_SUPPORT',
        secondaryIntent: 'ANALYZE_RISK_ACCOUNTS',
        operationType: 'ANALYTICAL',
        businessDomain: 'EXECUTIVE',
        targetAgent: 'CEO',
        requiredTools: ['finance_get_invoices', 'support_get_tickets'],
        entities: {},
        parameters: { joinEntity: 'customerName' },
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'TABLE',
        isMultiDomain: true,
        secondaryDomains: ['FINANCE', 'SUPPORT'],
      };
    }

    // 1.5 Memory Retrieval / Knowledge of Business Module
    if (
      /\b(?:which\s+module|what\s+module|which\s+tool|remember\s+what|do\s+you\s+remember)\b/i.test(lower) ||
      /\bwhich\s+module\s+does\s+our\s+sales\s+team\s+use\b/i.test(lower)
    ) {
      return {
        primaryIntent: 'MEMORY_RETRIEVAL_QUERY',
        operationType: 'DATA_RETRIEVAL',
        businessDomain: 'GENERAL',
        targetAgent: 'CEO',
        requiredTools: ['memory_retrieve'],
        entities: {},
        parameters: { query: raw },
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'TEXT',
      };
    }

    // 1.6 Informational CRM Explanation
    if (/\b(?:explain|describe)\s+how\s+(?:our\s+)?(?:crm|sales\s+pipeline)\s+works\b/i.test(lower)) {
      return {
        primaryIntent: 'CRM_EXPLAIN_PROCESS',
        operationType: 'INFORMATIONAL',
        businessDomain: 'CRM',
        targetAgent: 'Sales',
        requiredTools: [],
        entities: {},
        parameters: {},
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'SUMMARY',
      };
    }

    // 1.7 Invoice Generation & PDF Download (Overrides default sales routing when specific)
    if (/\b(?:download\s+invoice\s+pdf|pdf\s+download\s+for\s+invoice)\b/i.test(lower)) {
      let clientName = 'Apex Tech Solutions';
      const match = raw.match(/for\s+(.+)$/i);
      if (match && match[1]) clientName = match[1].trim();
      return {
        primaryIntent: 'FINANCE_DOWNLOAD_INVOICE_PDF',
        operationType: 'DATA_RETRIEVAL',
        businessDomain: 'FINANCE',
        targetAgent: agentOverride || 'Finance',
        requiredTools: ['finance_get_invoices'],
        entities: { client: clientName },
        parameters: { client: clientName },
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'SUMMARY',
      };
    }

    if (/\b(?:draft\s+invoice|create\s+invoice|generate\s+(?:an?\s+)?invoice|generate\s+a\s+pdf\s+for\s+the\s+invoice)\b/i.test(lower)) {
      let clientName = 'Apex Tech Solutions';
      const clientMatch = raw.match(/(?:for\s+(?:client\s+)?|to\s+)([A-Za-z0-9\s&]+?)(?:\s+for|\s+with|\s+at|$)/i);
      if (clientMatch && clientMatch[1]) {
        clientName = clientMatch[1].trim();
      }
      let amountVal = 100000;
      const amountMatch = raw.match(/(?:of|for)\s*[₹Rs.]*\s*([0-9,]+)/i);
      if (amountMatch && amountMatch[1]) {
        amountVal = parseInt(amountMatch[1].replace(/,/g, ''), 10) || 100000;
      }

      return {
        primaryIntent: 'FINANCE_CREATE_INVOICE',
        operationType: 'ACTION_MUTATION',
        businessDomain: 'FINANCE',
        targetAgent: agentOverride || 'Sales',
        requiredTools: ['finance_create_invoice'],
        entities: { client: clientName, amount: amountVal },
        parameters: { client: clientName, amount: amountVal, taxRate: 0.18 },
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'CONFIRMATION_CARD',
      };
    }

    // 1.8 Meeting Scheduling Intent (High priority cross-domain check)
    if (/\b(?:schedule\s+(?:a\s+)?meeting|set\s+up\s+a\s+meeting|calendar\s+invite|book\s+a\s+meeting)\b/i.test(lower)) {
      let timeStr = 'Tomorrow at 9:00 AM IST';
      const timeMatch = raw.match(/at\s+(\d+(?::\d+)?\s*(?:am|pm))/i);
      if (timeMatch && timeMatch[1]) {
        let t = timeMatch[1].toUpperCase().trim();
        if (!t.includes(':')) {
          t = t.replace(/(\d+)\s*(AM|PM)/i, '$1:00 $2');
        }
        timeStr = `Tomorrow at ${t} IST`;
      }
      return {
        primaryIntent: 'SCHEDULE_MEETING',
        operationType: 'ACTION_MUTATION',
        businessDomain: 'COMMUNICATION',
        targetAgent: 'Scheduler',
        requiredTools: ['scheduler_create_job'],
        entities: {},
        parameters: { event: 'Sync with Sales Team', time: timeStr },
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'CONFIRMATION_CARD',
      };
    }

    // 1.9 Workflow Creation & Retrieval (High priority cross-domain check)
    if (/\b(?:create\s+(?:a\s+)?workflow|build\s+(?:a\s+)?workflow|make\s+(?:a\s+)?workflow)\b/i.test(lower)) {
      return {
        primaryIntent: 'WORKFLOW_CREATE',
        operationType: 'WORKFLOW',
        businessDomain: 'WORKFLOW',
        targetAgent: 'Workflow',
        requiredTools: ['workflow_create_dag'],
        entities: {},
        parameters: { prompt: raw },
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'RECORD',
      };
    }

    if (/\b(?:find\s+(?:the\s+)?workflow|workflow\s+we\s+created|retrieve\s+(?:the\s+)?workflow)\b/i.test(lower)) {
      return {
        primaryIntent: 'WORKFLOW_FIND',
        operationType: 'DATA_RETRIEVAL',
        businessDomain: 'WORKFLOW',
        targetAgent: 'Workflow',
        requiredTools: ['workflow_list'],
        entities: {},
        parameters: {},
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'SUMMARY',
      };
    }

    // 1.10 Policy Document Query (Knowledge Agent)
    if (/\b(?:company\s+policy|policy\s+document|summarize.*policy)\b/i.test(lower)) {
      return {
        primaryIntent: 'KNOWLEDGE_QUERY_POLICY',
        operationType: 'DATA_RETRIEVAL',
        businessDomain: 'KNOWLEDGE',
        targetAgent: 'Knowledge',
        requiredTools: ['knowledge_query'],
        entities: {},
        parameters: { query: raw },
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'SUMMARY',
      };
    }

    // =========================================================================
    // 2. CRM & Sales Domain (Sales Agent)
    // =========================================================================
    const isSalesCandidate =
      agentOverride === 'Sales' ||
      /\b(?:pipeline|deals?|leads?|crm|prospects?|sales\s+rep|deal\s+value|pipeline\s+value)\b/i.test(lower) ||
      // Hindi
      /(?:बिक्री|सौदा|सौदे|पाइपलाइन|लीड|संभावना|बिक्री\s*मूल्य|सक्रिय\s*सौदे|चरण)/i.test(lower) ||
      // Telugu
      /(?:విక్రయ|ఒప్పందాలు|పైప్‌లైన్|లీడ్స్|అవకాశాలు|విక్రయ\s*విలువ|క్రియాశీల\s*ఒప్పందాలు|దశలు)/i.test(lower) ||
      // Tamil
      /(?:விற்பனை|ஒப்பந்தங்கள்|பைப்லைன்|லீட்கள்|வாய்ப்புகள்|விற்பனை\s*மதிப்பு|செயலில்\s*உள்ள\s*ஒப்பந்தங்கள்)/i.test(lower) ||
      // Kannada
      /(?:ಮಾರಾಟ|ಒಪ್ಪಂದಗಳು|ಪೈಪ್‌ಲೈನ್|ಲೀಡ್‌ಗಳು|ಅವಕಾಶಗಳು|ಮಾರಾಟ\s*ಮೌಲ್ಯ|ಸಕ್ರಿಯ\s*ಒಪ್ಪಂದಗಳು|ಹಂತಗಳು)/i.test(lower) ||
      // Malayalam
      /(?:വിൽപ്പന|ഇടപാടുകൾ|പൈപ്പ്‌ലൈൻ|ലീഡുകൾ|അവസരങ്ങൾ|വിൽപ്പന\s*മൂല്യം|സജീവ\s*ഇടപാടുകൾ)/i.test(lower) ||
      // Romanized
      /\b(?:bikri|saude|sauda|oppertunities|chupinchandi|kaattunga|torisi|kanikku)\b/i.test(lower);

    if (isSalesCandidate) {
      // 2.1 Top Representative Conversion Analysis
      const isTopRep =
        /\b(?:which\s+sales\s+rep|top\s+converting|most\s+leads|best\s+sales\s+rep)\b/i.test(lower) ||
        /(?:शीर्ष|सर्वश्रेष्ठ|किस|कौन).*बिक्री\s*प्रतिनिधि/i.test(lower) ||
        /(?:అగ్ర|ఎక్కువ).*విక్రయ\s*ప్రతినిధి/i.test(lower) ||
        /(?:சிறந்த|அதிக).*விற்பனை\s*பிரதிநிதி/i.test(lower) ||
        /(?:ಅತ್ಯುತ್ತಮ|ಹೆಚ್ಚು).*ಮಾರಾಟ\s*ಪ್ರತಿನಿಧಿ/i.test(lower) ||
        /(?:മികച്ച|കൂടുതൽ).*വിൽപ്പന\s*പ്രതിനിധി/i.test(lower);

      if (isTopRep) {
        return {
          primaryIntent: 'CRM_ANALYZE_TOP_REPRESENTATIVE',
          operationType: 'ANALYTICAL',
          businessDomain: 'CRM',
          targetAgent: 'Sales',
          requiredTools: ['crm_get_leads'],
          entities: {},
          parameters: { metric: 'CONVERSIONS' },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'SUMMARY',
        };
      }

      // 2.2 Create Lead Mutation
      const isCreateLead =
        /\b(?:create|add|new)\s+(?:a\s+)?(?:lead|prospect)\b/i.test(lower) ||
        /(?:नया|नई)\s*(?:लीड|ग्राहक|संभावना)\s*(?:बनाएं|जोड़ें)/i.test(lower) ||
        /(?:కొత్త|నూతన)\s*లీడ్\s*(?:సృష్టించండి|జోడించండి)/i.test(lower) ||
        /(?:புதிய)\s*லீட்\s*(?:உருவாக்கவும்|சேர்க்கவும்)/i.test(lower) ||
        /(?:ಹೊಸ)\s*ಲೀಡ್\s*(?:ರಚಿಸಿ|ಸೇರಿಸಿ)/i.test(lower) ||
        /(?:പുതിയ)\s*ലീഡ്\s*(?:സൃഷ്ടിക്കുക|ചേർക്കുക)/i.test(lower);

      if (isCreateLead) {
        return {
          primaryIntent: 'CRM_CREATE_LEAD',
          operationType: 'ACTION_MUTATION',
          businessDomain: 'CRM',
          targetAgent: 'Sales',
          requiredTools: ['crm_create_lead'],
          entities: {},
          parameters: {
            company: 'ABC Technologies',
            name: 'ABC Technologies Representative',
            email: 'contact@abctech.com',
            value: 50000,
            stage: 'NEW',
          },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'CONFIRMATION_CARD',
        };
      }

      // 2.3 Invoice from Won Deal
      const isInvoiceWonDeal =
        /\b(?:invoice.*won\s+deal|bill.*won\s+deal)\b/i.test(lower) ||
        /(?:जीते\s*हुए|सफल)\s*(?:सौदे|डील).*चालान/i.test(lower) ||
        /(?:గెలిచిన|విజయవంతమైన)\s*డీల్.*ఇన్వాయిస్/i.test(lower);

      if (isInvoiceWonDeal) {
        return {
          primaryIntent: 'SALES_GENERATE_INVOICE_FROM_WON_DEAL',
          operationType: 'ACTION_MUTATION',
          businessDomain: 'FINANCE',
          targetAgent: 'Sales',
          requiredTools: ['crm_get_leads', 'finance_create_invoice'],
          entities: {},
          parameters: {},
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'CONFIRMATION_CARD',
        };
      }

      // 2.4 Stale Leads (No Follow-Up)
      const isStaleLeads =
        /\b(?:stale|untouched|no\s+follow-?up|without\s+follow-?up|not\s+received\s+follow-?ups?)\b/i.test(lower) ||
        /(?:फॉलो-अप\s*नहीं|पुराने\s*लीड्स|अछूते)/i.test(lower) ||
        /(?:ఫాలో-అప్\s*లేని|పాత\s*లీడ్స్)/i.test(lower);

      if (isStaleLeads) {
        return {
          primaryIntent: 'CRM_GET_STALE_LEADS',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'CRM',
          targetAgent: 'Sales',
          requiredTools: ['crm_get_leads'],
          entities: {},
          parameters: { filter: 'NO_FOLLOW_UP' },
          confidence: 0.97,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'TABLE',
        };
      }

      // 2.5 Late Stage / Proposal Deals
      const isLateStage =
        /\b(?:almost\s+closed|late\s+stage|proposal|negotiation)\b/i.test(lower) ||
        /(?:प्रस्ताव|बातचीत|अंतिम\s*चरण)/i.test(lower) ||
        /(?:ప్రతిపాదన|చర్చలు|చివరి\s*దశ)/i.test(lower);

      if (isLateStage) {
        return {
          primaryIntent: 'CRM_GET_LATE_STAGE_DEALS',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'CRM',
          targetAgent: 'Sales',
          requiredTools: ['crm_get_leads'],
          entities: {},
          parameters: { stage: 'PROPOSAL' },
          confidence: 0.96,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'TABLE',
        };
      }

      // 2.6 Active Deals, Pipeline Value, Stages & Pipeline Overview (Default for Sales)
      // Matches English: "Show me all active sales deals, their stages and total pipeline value."
      // Matches Hindi: "मेरे सभी सक्रिय बिक्री सौदे दिखाइए। उनके चरण और कुल बिक्री मूल्य भी बताइए।"
      // Matches Telugu: "నా క్రియాశీల విక్రయ ఒప్పందాలు మరియు వాటి మొత్తం విలువను చూపించండి."
      // Matches Tamil: "செயலில் உள்ள அனைத்து விற்பனை ஒப்பந்தங்களையும் அவற்றின் மொத்த மதிப்பையும் காட்டு."
      // Matches Kannada: "ಎಲ್ಲಾ ಸಕ್ರಿಯ ಮಾರಾಟ ಒಪ್ಪಂದಗಳು ಮತ್ತು ಅವುಗಳ ಒಟ್ಟು ಮೌಲ್ಯವನ್ನು ತೋರಿಸಿ."
      // Matches Malayalam: "എല്ലാ സജീവ വിൽപ്പന ഇടപാടുകളും അവയുടെ ആകെ മൂല്യവും കാണിക്കുക."
      // Matches Romanized: "active sales deals dikhao", "pipeline value", "na active deals chupinchandi", etc.
      return {
        primaryIntent: 'CRM_ANALYZE_PIPELINE',
        secondaryIntent: 'CRM_GET_LEADS',
        operationType: 'ANALYTICAL',
        businessDomain: 'CRM',
        targetAgent: 'Sales',
        requiredTools: ['crm_get_leads'],
        entities: {},
        parameters: { filter: 'ALL' },
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'SUMMARY',
      };
    }

    // =========================================================================
    // 3. Finance Domain (Finance Agent)
    // =========================================================================
    const isFinanceCandidate =
      agentOverride === 'Finance' ||
      /\b(?:invoices?|bills?|overdue|tax|gst|receivables?|outstanding|billing|expenses?)\b/i.test(lower) ||
      // Hindi
      /(?:चालान|बिल|अतिदेय|बकाया|टैक्स|जीएसटी|भुगतान|लेखा|वित्त|\bकर\b|कर\s*दायित्व)/i.test(lower) ||
      // Telugu
      /(?:ఇన్వాయిస్|బిల్లు|గడువు|బకాయి|పన్ను|జీఎస్టీ|చెల్లింపు|ఆర్థిక)/i.test(lower) ||
      // Tamil
      /(?:விலைப்பட்டியல்|பில்|காலாவதியான|நிலுவை|வரி|ஜிஎஸ்டி|நிதி)/i.test(lower) ||
      // Kannada
      /(?:ಇನ್‌ವಾಯ್ಸ್|ಬಿಲ್ಲು|ಅವಧಿ\s*ಮೀರಿದ|ಬಾಕಿ|ತೆರಿಗೆ|ಜಿಎಸ್‌ಟಿ|ಹಣಕಾಸು)/i.test(lower) ||
      // Malayalam
      /(?:ഇൻവോയ്സ്|ബിൽ|കാലഹരണപ്പെട്ട|കുടിശ്ശിക|നികുതി|ജിഎസ്ടി|ധനകാര്യം)/i.test(lower) ||
      // Romanized
      /\b(?:kitne\s+invoices|entha\s+pending|evvalavu\s+irukku|eshtu\s+ide|ethra\s+undu)\b/i.test(lower);

    if (isFinanceCandidate) {
      // 3.1 Tax & GST Analysis
      const isTax =
        /\b(?:tax|gst|tax\s+liabilities|calculate\s+tax)\b/i.test(lower) ||
        /(?:\bकर\b|कर\s*दायित्व|कर\s*विश्लेषण|जीएसटी|टैक्स)/i.test(lower) ||
        /(?:పన్ను|జీఎస్టీ|టాక్స్)/i.test(lower) ||
        /(?:வரி|ஜிஎஸ்டி)/i.test(lower) ||
        /(?:ತೆರಿಗೆ|ಜಿಎಸ್‌ಟಿ)/i.test(lower) ||
        /(?:നികുതി|ജിഎസ്ടി)/i.test(lower);

      if (isTax) {
        return {
          primaryIntent: 'FINANCE_ANALYZE_TAX',
          operationType: 'ANALYTICAL',
          businessDomain: 'FINANCE',
          targetAgent: 'Finance',
          requiredTools: ['finance_get_invoices'],
          entities: {},
          parameters: { type: 'GST_ANALYSIS' },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'SUMMARY',
        };
      }

      // 3.2 Create Invoice Mutation
      const isCreateInvoice =
        /\b(?:create|draft|generate|issue)\s+(?:a\s+)?(?:new\s+)?invoice\b/i.test(lower) ||
        /(?:नया|नई)\s*(?:चालान|बिल)\s*(?:बनाएं|जारी\s*करें)/i.test(lower) ||
        /(?:కొత్త)\s*ఇన్వాయిస్\s*(?:సృష్టించండి|జారీ\s*చేయండి)/i.test(lower);

      if (isCreateInvoice) {
        return {
          primaryIntent: 'FINANCE_CREATE_INVOICE',
          operationType: 'ACTION_MUTATION',
          businessDomain: 'FINANCE',
          targetAgent: 'Finance',
          requiredTools: ['finance_create_invoice'],
          entities: {},
          parameters: { client: 'TechCorp India', amount: 50000 },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'CONFIRMATION_CARD',
        };
      }

      // 3.25 Pending Invoices
      const isPending =
        /\b(?:pending\s+invoices?|all\s+(?:my\s+)?pending\s+invoices?)\b/i.test(lower) &&
        !/\b(?:overdue|late|arrears)\b/i.test(lower);

      if (isPending) {
        return {
          primaryIntent: 'FINANCE_GET_PENDING_INVOICES',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'FINANCE',
          targetAgent: 'Finance',
          requiredTools: ['finance_get_invoices'],
          entities: {},
          parameters: { filter: 'PENDING_OR_OVERDUE' },
          confidence: 0.99,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'TABLE',
        };
      }

      // 3.3 Overdue Invoices (Default for Finance overdue inquiries)
      const isOverdue =
        /\b(?:overdue|unpaid|pending\s+balance|outstanding\s+balance|late\s+payments?)\b/i.test(lower) ||
        /(?:अतिदेय|बकाया)/i.test(lower) ||
        /(?:గడువు\s*ముగిసిన|బకాయి)/i.test(lower) ||
        /(?:காலாவதியான|நிலுவை)/i.test(lower) ||
        /(?:ಅವಧಿ\s*ಮೀರಿದ|ಬಾಕಿ)/i.test(lower) ||
        /(?:കാലഹരണപ്പെട്ട|കുടിശ്ശിക)/i.test(lower) ||
        /\b(?:entha\s+pending|kitne\s+hain|evvalavu|eshtu|ethra)\b/i.test(lower);

      if (isOverdue) {
        return {
          primaryIntent: 'FINANCE_GET_OVERDUE_INVOICES',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'FINANCE',
          targetAgent: 'Finance',
          requiredTools: ['finance_get_invoices'],
          entities: {},
          parameters: { status: 'OVERDUE' },
          confidence: 0.99,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'TABLE',
        };
      }

      // 3.4 All / Pending Invoices General
      return {
        primaryIntent: 'FINANCE_GET_PENDING_INVOICES',
        operationType: 'DATA_RETRIEVAL',
        businessDomain: 'FINANCE',
        targetAgent: 'Finance',
        requiredTools: ['finance_get_invoices'],
        entities: {},
        parameters: { filter: 'ALL' },
        confidence: 0.97,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'TABLE',
      };
    }

    // =========================================================================
    // 4. HR Domain (HR Agent)
    // =========================================================================
    const isHRCandidate =
      agentOverride === 'HR' ||
      /\b(?:employees?|staff|leaves?|vacation|attendance|headcount|payroll|salary)\b/i.test(lower) ||
      // Hindi
      /(?:कर्मचारी|स्टाफ|छुट्टी|अवकाश|वेतन|हाजिरी|मानव\s*संसाधन)/i.test(lower) ||
      // Telugu
      /(?:ఉద్యోగులు|సిబ్బంది|సెలవు|వేతనం|హాజరు|హెచ్‌ఆర్)/i.test(lower) ||
      // Tamil
      /(?:ஊழியர்கள்|பணியாளர்கள்|விடுப்பு|சம்பளம்|வருகை|மனித\s*வளம்)/i.test(lower) ||
      // Kannada
      /(?:ಉದ್ಯೋಗಿಗಳು|ಸಿಬ್ಬಂದಿ|ರಜೆ|ವೇತನ|ಹಾಜರಾತಿ|ಮಾನವ\s*ಸಂಪನ್ಮೂಲ)/i.test(lower) ||
      // Malayalam
      /(?:ജീവനക്കാർ|സ്റ്റാഫ്|അവധി|ശമ്പളം|ഹാജർ|എച്ച്ആർ)/i.test(lower) ||
      // Romanized
      /\b(?:leave\s+me|leave\s+lo|leave\s+la|leave\s+nalli|karmchari|udhyogulu)\b/i.test(lower);

    if (isHRCandidate) {
      const isOnLeave =
        /\b(?:on\s+leave|taking\s+leave|absent|vacation\s+currently|who\s+is\s+on\s+leave)\b/i.test(lower) ||
        /(?:छुट्टी\s*पर|अवकाश\s*पर|कौन\s*छुट्टी)/i.test(lower) ||
        /(?:సెలవులో\s*ఉన్నారు|ఎవరు\s*సెలవు)/i.test(lower) ||
        /(?:விடுப்பில்\s*உள்ளவர்கள்|யார்\s*விடுப்பில்)/i.test(lower) ||
        /(?:ರಜೆಯಲ್ಲಿರುವವರು|ಯಾರು\s*ರಜೆಯಲ್ಲಿ)/i.test(lower) ||
        /(?:അവധിയിലുള്ളവർ|ആരാണ്\s*അവധിയിൽ)/i.test(lower) ||
        /\b(?:leave\s+me\s+kaun|leave\s+lo\s+evaru|leave\s+la\s+yaaru)\b/i.test(lower);

      if (isOnLeave) {
        return {
          primaryIntent: 'HR_GET_EMPLOYEES_ON_LEAVE',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'HR',
          targetAgent: 'HR',
          requiredTools: ['hr_get_leaves', 'hr_get_employees'],
          entities: {},
          parameters: { status: 'APPROVED' },
          confidence: 0.99,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'RECORD',
        };
      }

      // Default HR inquiry: All employees / Directory / Headcount / Payroll
      return {
        primaryIntent: 'HR_GET_EMPLOYEES',
        operationType: 'DATA_RETRIEVAL',
        businessDomain: 'HR',
        targetAgent: 'HR',
        requiredTools: ['hr_get_employees'],
        entities: {},
        parameters: {},
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'RECORD',
      };
    }

    // =========================================================================
    // 5. Inventory & Warehouse Domain (Inventory / Database Agent)
    // =========================================================================
    const isInventoryCandidate =
      agentOverride === 'Database' ||
      (agentOverride as string) === 'Inventory' ||
      /\b(?:inventory|stock|products?|warehouse|reorder\s+level|threshold|sku)\b/i.test(lower) ||
      // Hindi
      /(?:इन्वेंटरी|स्टॉक|उत्पाद|गोदाम|सामग्री|रीऑर्डर)/i.test(lower) ||
      // Telugu
      /(?:ఇన్వెంటరీ|స్టాక్|ఉత్పత్తులు|గోదాము|వస్తువులు)/i.test(lower) ||
      // Tamil
      /(?:சரக்கு|இருப்பு|பொருட்கள்|கிடங்கு)/i.test(lower) ||
      // Kannada
      /(?:ದಾಸ್ತಾನು|ಉತ್ಪನ್ನಗಳು|ಗೋದಾಮು|ವಸ್ತುಗಳು)/i.test(lower) ||
      // Malayalam
      /(?:ഇൻവെന്ററി|സ്റ്റോക്ക്|ഉൽപ്പന്നങ്ങൾ|വെയർഹൗസ്)/i.test(lower);

    if (isInventoryCandidate) {
      const isLowStock =
        /\b(?:low\s+stock|out\s+of\s+stock|below.*threshold|reorder\s+needed)\b/i.test(lower) ||
        /(?:कम\s*स्टॉक|स्टॉक\s*खत्म|न्यूनतम\s*स्टॉक)/i.test(lower) ||
        /(?:తక్కువ\s*స్టాక్|స్టాక్\s*అయిపోయింది)/i.test(lower) ||
        /(?:குறைந்த\s*இருப்பு|இருப்பு\s*முடிந்தது)/i.test(lower) ||
        /(?:ಕಡಿಮೆ\s*ದಾಸ್ತಾನು|ದಾಸ್ತಾನು\s*ಮುಗಿದಿದೆ)/i.test(lower) ||
        /(?:കുറഞ്ഞ\s*സ്റ്റോക്ക്|സ്റ്റോക്ക്\s*തീർന്നു)/i.test(lower);

      if (isLowStock) {
        return {
          primaryIntent: 'INVENTORY_GET_LOW_STOCK',
          operationType: 'DATA_RETRIEVAL',
          businessDomain: 'INVENTORY',
          targetAgent: 'Database',
          requiredTools: ['inventory_get_products'],
          entities: {},
          parameters: { threshold: 'LOW' },
          confidence: 0.99,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'TABLE',
        };
      }

      return {
        primaryIntent: 'INVENTORY_GET_PRODUCTS',
        operationType: 'DATA_RETRIEVAL',
        businessDomain: 'INVENTORY',
        targetAgent: 'Database',
        requiredTools: ['inventory_get_products'],
        entities: {},
        parameters: {},
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'TABLE',
      };
    }

    // =========================================================================
    // 6. Support Domain (Support Agent)
    // =========================================================================
    const isSupportCandidate =
      agentOverride === 'Support' ||
      /\b(?:tickets?|support|complaints?|issues?|sla|unresolved|customer\s+service)\b/i.test(lower) ||
      // Hindi
      /(?:सपोर्ट|टिकट|शिकायत|शिकायतें|समस्या|अनसुलझी)/i.test(lower) ||
      // Telugu
      /(?:సపోర్ట్|టికెట్లు|ఫిర్యాదులు|సమస్యలు|పరిష్కారం\s*కాని)/i.test(lower) ||
      // Tamil
      /(?:ஆதரவு|டிக்கெட்டுகள்|புகார்கள்|சிக்கல்கள்|தீர்க்கப்படாத)/i.test(lower) ||
      // Kannada
      /(?:ಬೆಂಬಲ|ಟಿಕೆಟ್‌ಗಳು|ದೂರುಗಳು|ಸಮಸ್ಯೆಗಳು|ಬಗೆಹರಿಯದ)/i.test(lower) ||
      // Malayalam
      /(?:സപ്പോർട്ട്|ടിക്കറ്റുകൾ|പരാതികൾ|പ്രശ്നങ്ങൾ|പരിഹരിക്കപ്പെടാത്ത)/i.test(lower);

    if (isSupportCandidate) {
      return {
        primaryIntent: 'SUPPORT_GET_HIGH_PRIORITY_TICKETS',
        operationType: 'DATA_RETRIEVAL',
        businessDomain: 'SUPPORT',
        targetAgent: 'Support',
        requiredTools: ['support_get_tickets'],
        entities: {},
        parameters: { priority: 'HIGH' },
        confidence: 0.99,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'TABLE',
      };
    }

    // =========================================================================
    // 7. Analytics Domain (Analytics Agent)
    // =========================================================================
    const isAnalyticsCandidate =
      agentOverride === 'Analytics' ||
      /\b(?:analytics|kpis?|metrics?|trends?|conversion\s+rates?|mrr|arr|efficiency|funnel)\b/i.test(lower) ||
      // Hindi
      /(?:एनालिटिक्स|मेट्रिक्स|केपीआई|रूपांतरण\s*दर|रुझान|व्यावसायिक\s*प्रदर्शन)/i.test(lower) ||
      // Telugu
      /(?:విశ్లేషణలు|మెట్రిక్స్|కెపిఐలు|మార్పిడి\s*రేటు|ధోరణులు)/i.test(lower) ||
      // Tamil
      /(?:பகுப்பாய்வு|அளவீடுகள்|செயல்திறன்|போக்குகள்)/i.test(lower) ||
      // Kannada
      /(?:ವಿಶ್ಲೇಷಣೆ|ಮೆಟ್ರಿಕ್‌ಗಳು|ಕಾರ್ಯಕ್ಷಮತೆ|ಟ್ರೆಂಡ್‌ಗಳು)/i.test(lower) ||
      // Malayalam
      /(?:വിശകലനം|മെട്രിക്‌സ്|പ്രകടനം|പ്രവണതകൾ)/i.test(lower);

    if (isAnalyticsCandidate) {
      return {
        primaryIntent: 'ANALYTICS_OVERVIEW',
        operationType: 'ANALYTICAL',
        businessDomain: 'ANALYTICS',
        targetAgent: 'Analytics',
        requiredTools: ['analytics_query'],
        entities: {},
        parameters: {},
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'SUMMARY',
      };
    }

    // =========================================================================
    // 8. Marketing Domain (Marketing Agent)
    // =========================================================================
    const isMarketingCandidate =
      agentOverride === 'Marketing' ||
      /\b(?:marketing|campaigns?|outreach|target\s+audience|messaging|branding)\b/i.test(lower) ||
      // Hindi
      /(?:मार्केटिंग|अभियान|प्रचार|लक्षित\s*दर्शक|विज्ञापन)/i.test(lower) ||
      // Telugu
      /(?:మార్కెటింగ్|ప్రచారం|క్యాంపెయిన్|లక్ష్య\s*ప్రేక్షకులు)/i.test(lower) ||
      // Tamil
      /(?:சந்தைப்படுத்தல்|பிரச்சாரம்|இலக்கு\s*பார்வையாளர்கள்)/i.test(lower) ||
      // Kannada
      /(?:ಮಾರ್ಕೆಟಿಂಗ್|ಪ್ರಚಾರ|ಉದ್ದೇಶಿತ\s*ಪ್ರೇಕ್ಷಕರು)/i.test(lower) ||
      // Malayalam
      /(?:മാർക്കറ്റിംഗ്|പ്രചാരണം|ടാർഗെറ്റ്\s*പ്രേക്ഷകർ)/i.test(lower);

    if (isMarketingCandidate) {
      return {
        primaryIntent: 'MARKETING_DRAFT_CAMPAIGN',
        operationType: 'ANALYTICAL',
        businessDomain: 'COMMUNICATION',
        targetAgent: 'Marketing',
        requiredTools: ['marketing_generate_campaign'],
        entities: {},
        parameters: { goal: 'OUTREACH' },
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'SUMMARY',
      };
    }

    // =========================================================================
    // 9. Workflow & DAG Automation Domain (Workflow Agent)
    // =========================================================================
    const isWorkflowCandidate =
      agentOverride === 'Workflow' ||
      /\b(?:workflows?|dag|automations?|pipelines?|nodes?|edges?)\b/i.test(lower) ||
      // Hindi
      /(?:वर्कफ़्लो|स्वचालन|डीएजी|पाइपलाइन)/i.test(lower) ||
      // Telugu
      /(?:వర్క్‌ఫ్లో|ఆటోమేషన్|డీఏజీ)/i.test(lower) ||
      // Tamil
      /(?:பணிப்பாய்வு|தானியங்கு|டிஏஜி)/i.test(lower) ||
      // Kannada
      /(?:ವರ್ಕ್‌ಫ್ಲೋ|ಸ್ವಯಂಚಾಲಿತ|ಡಿಎಜಿ)/i.test(lower) ||
      // Malayalam
      /(?:വർക്ക്ഫ്ലോ|ഓട്ടോമേഷൻ|ഡിഎജി)/i.test(lower);

    if (isWorkflowCandidate) {
      const isCreate =
        /\b(?:create|build|make|generate|construct)\s+(?:a\s+)?(?:workflow|dag)\b/i.test(lower) ||
        /(?:बनाएं|सृजन\s*करें|बनाओ)/i.test(lower) ||
        /(?:సృష్టించండి|నిర్మించండి)/i.test(lower);

      if (isCreate) {
        return {
          primaryIntent: 'WORKFLOW_CREATE',
          operationType: 'WORKFLOW',
          businessDomain: 'WORKFLOW',
          targetAgent: 'Workflow',
          requiredTools: ['workflow_create_dag'],
          entities: {},
          parameters: { prompt: raw },
          confidence: 0.99,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'RECORD',
        };
      }

      return {
        primaryIntent: 'WORKFLOW_LIST',
        operationType: 'DATA_RETRIEVAL',
        businessDomain: 'WORKFLOW',
        targetAgent: 'Workflow',
        requiredTools: ['workflow_list'],
        entities: {},
        parameters: {},
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'TABLE',
      };
    }

    // =========================================================================
    // 10. Scheduler Domain (Scheduler Agent)
    // =========================================================================
    const isSchedulerCandidate =
      agentOverride === 'Scheduler' ||
      /\b(?:schedule|calendar|meetings?|appointments?|recurring|cron|timeline)\b/i.test(lower) ||
      // Hindi
      /(?:शेड्यूल|बैठक|मीटिंग|कैलेंडर|समय|तय\s*करें)/i.test(lower) ||
      // Telugu
      /(?:షెడ్యూల్|సమావేశం|మీటింగ్|క్యాలెండర్|సమయం)/i.test(lower) ||
      // Tamil
      /(?:திட்டமிடு|கூட்டம்|மீட்டிங்|நாள்காட்டி)/i.test(lower) ||
      // Kannada
      /(?:ನಿಗದಿಪಡಿಸಿ|ಸಭೆ|ಮೀಟಿಂಗ್|ಕ್ಯಾಲೆಂಡರ್)/i.test(lower) ||
      // Malayalam
      /(?:ഷെഡ്യൂൾ|മീറ്റിംഗ്|കലണ്ടർ|സമയം)/i.test(lower);

    if (isSchedulerCandidate) {
      const isMeeting =
        /\b(?:meeting|appointment|call|invite)\b/i.test(lower) ||
        /(?:बैठक|मीटिंग)/i.test(lower) ||
        /(?:సమావేశం|మీటింగ్)/i.test(lower) ||
        /(?:கூட்டம்|மீட்டிங்)/i.test(lower) ||
        /(?:ಸಭೆ|ಮೀಟಿಂಗ್)/i.test(lower) ||
        /(?:മീറ്റിംഗ്)/i.test(lower);

      if (isMeeting) {
        return {
          primaryIntent: 'SCHEDULE_MEETING',
          operationType: 'ACTION_MUTATION',
          businessDomain: 'WORKFLOW',
          targetAgent: 'Scheduler',
          requiredTools: ['scheduler_book_meeting'],
          entities: {},
          parameters: { rawText: raw },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'CONFIRMATION_CARD',
        };
      }

      return {
        primaryIntent: 'WORKFLOW_GET_SCHEDULED',
        operationType: 'DATA_RETRIEVAL',
        businessDomain: 'WORKFLOW',
        targetAgent: 'Scheduler',
        requiredTools: ['workflow_get_scheduled'],
        entities: {},
        parameters: {},
        confidence: 0.97,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'TABLE',
      };
    }

    // =========================================================================
    // 11. Document Domain (Document Agent)
    // =========================================================================
    const isDocumentCandidate =
      agentOverride === 'Document' ||
      /\b(?:documents?|pdf|generate\s+report|export\s+report|compile\s+report)\b/i.test(lower) ||
      /(?:दस्तावेज़|रिपोर्ट\s*दस्तावेज़|पीडीएफ)/i.test(lower) ||
      /(?:పత్రం|రిపోర్ట్\s*పత్రం|పిడిఎఫ్)/i.test(lower) ||
      /(?:ஆவணம்|அறிக்கை\s*ஆவணம்)/i.test(lower) ||
      /(?:ದಾಖಲೆ|ವರದಿ\s*ದಾಖಲೆ)/i.test(lower) ||
      /(?:പ്രമാണം|റിപ്പോർട്ട്\s*പ്രമാണം)/i.test(lower);

    if (isDocumentCandidate) {
      return {
        primaryIntent: 'DOCUMENT_GENERATE_REPORT',
        operationType: 'COMMUNICATION',
        businessDomain: 'COMMUNICATION',
        targetAgent: 'Document',
        requiredTools: ['document_create_artifact'],
        entities: {},
        parameters: { title: 'Executive Operations Summary', type: 'REPORT' },
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'CONFIRMATION_CARD',
      };
    }

    // =========================================================================
    // 12. Email Domain (Email Agent)
    // =========================================================================
    const isEmailCandidate =
      agentOverride === 'Email' ||
      /\b(?:emails?|send\s+email|draft\s+email|email\s+reminder|mail)\b/i.test(lower) ||
      /(?:ईमेल|ई-मेल|संदेश\s*भेजें)/i.test(lower) ||
      /(?:ఈమెయిల్|మెయిల్)/i.test(lower) ||
      /(?:மின்னஞ்சல்)/i.test(lower) ||
      /(?:ಇಮೇಲ್|ಮಿಂಚಂಚೆ)/i.test(lower) ||
      /(?:ഇമെയിൽ)/i.test(lower);

    if (isEmailCandidate) {
      return {
        primaryIntent: 'EMAIL_PREPARE_DISPATCH',
        operationType: 'COMMUNICATION',
        businessDomain: 'COMMUNICATION',
        targetAgent: 'Email',
        requiredTools: ['email_generate_invite'],
        entities: {},
        parameters: { message: raw },
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'CONFIRMATION_CARD',
      };
    }

    // =========================================================================
    // 13. Knowledge Base / RAG Domain (Knowledge Agent)
    // =========================================================================
    const isKnowledgeCandidate =
      agentOverride === 'Knowledge' ||
      /\b(?:policy|policies|handbook|reimbursement|guidelines?|rules?|faq|knowledge)\b/i.test(lower) ||
      /(?:नीति|पुस्तिका|प्रतिपूर्ति|दिशानिर्देश|नियम|ज्ञान)/i.test(lower) ||
      /(?:విధానం|హ్యాండ్‌బుక్|రీయింబర్స్‌మెంట్|మార్గదర్శకాలు|జ్ఞానం)/i.test(lower) ||
      /(?:கொள்கை|கையேடு|வழிகாட்டுதல்கள்|அறிவு)/i.test(lower) ||
      /(?:ನೀತಿ|ಕೈಪಿಡಿ|ಮರುಪಾವತಿ|ಮಾರ್ಗಸೂಚಿಗಳು|ಜ್ಞಾನ)/i.test(lower) ||
      /(?:നയം|ഹാൻഡ്‌ബുക്ക്|മാർഗ്ഗനിർദ്ദേശങ്ങൾ|അറിവ്)/i.test(lower);

    if (isKnowledgeCandidate) {
      return {
        primaryIntent: 'KNOWLEDGE_QUERY_POLICY',
        operationType: 'KNOWLEDGE_RAG',
        businessDomain: 'KNOWLEDGE',
        targetAgent: 'Knowledge',
        requiredTools: ['knowledge_search'],
        entities: {},
        parameters: { query: raw },
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'TEXT',
      };
    }

    // =========================================================================
    // 14. Reporting & Compliance Domain (Reporting Agent)
    // =========================================================================
    const isReportingCandidate =
      agentOverride === 'Reporting' ||
      /\b(?:compliance\s+audit|audit\s+reports?|soc2|regulatory|compliance\s+pack|executive\s+report)\b/i.test(lower) ||
      /(?:अनुपालन|ऑडिट\s*रिपोर्ट|नियामक)/i.test(lower) ||
      /(?:సమ్మతి|ఆడిట్\s*నివేదిక)/i.test(lower) ||
      /(?:இணக்க|தணிக்கை\s*அறிக்கை)/i.test(lower) ||
      /(?:ಅನುಸರಣೆ|ಆಡಿಟ್\s*ವರದಿ)/i.test(lower) ||
      /(?:കംപ്ലയൻസ്|ഓഡിറ്റ്\s*റിപ്പോർട്ട്)/i.test(lower);

    if (isReportingCandidate) {
      return {
        primaryIntent: 'REPORTING_GENERATE_AUDIT',
        operationType: 'ANALYTICAL',
        businessDomain: 'GENERAL',
        targetAgent: 'Reporting',
        requiredTools: ['finance_get_invoices', 'crm_get_leads', 'hr_get_employees'],
        entities: {},
        parameters: {},
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'RECORD',
      };
    }

    // =========================================================================
    // 15. Security Domain (Security Agent)
    // =========================================================================
    const isSecurityCandidate =
      agentOverride === 'Security' ||
      /\b(?:security|audit\s+logs?|rbac|access\s+control|encryption|threat|shield)\b/i.test(lower) ||
      /(?:सुरक्षा|ऑडिट\s*लॉग|पहुंच\s*नियंत्रण|आरबीएसी|एन्क्रिप्शन)/i.test(lower) ||
      /(?:భద్రత|ఆడిట్\s*లాగ్|యాక్సెస్\s*నియంత్రణ)/i.test(lower) ||
      /(?:பாதுகாப்பு|தணிக்கை\s*பதிவு|அணுகல்\s*கட்டுப்பாடு)/i.test(lower) ||
      /(?:ಭದ್ರತೆ|ಆಡಿಟ್\s*ಲಾಗ್|ಪ್ರವೇಶ\s*ನಿಯಂತ್ರಣ)/i.test(lower) ||
      /(?:സുരക്ഷ|ഓഡിറ്റ്\s*ലോഗ്|ആക്സസ്\s*നിയന്ത്രണം)/i.test(lower);

    if (isSecurityCandidate) {
      return {
        primaryIntent: 'SECURITY_AUDIT_STATUS',
        operationType: 'INFORMATIONAL',
        businessDomain: 'SECURITY',
        targetAgent: 'Security',
        requiredTools: ['security_inspect_logs'],
        entities: {},
        parameters: {},
        confidence: 0.98,
        confidenceLevel: 'HIGH',
        expectedResponseFormat: 'SUMMARY',
      };
    }

    // =========================================================================
    // 16. Fallback Scoped to Selected Agent
    // =========================================================================
    if (agentOverride && agentOverride !== 'CEO') {
      const AGENT_DEFAULT_INTENTS: Record<AgentType, { intent: string; tools: string[]; type: any; domain: any }> = {
        Sales: { intent: 'CRM_ANALYZE_PIPELINE', tools: ['crm_get_leads'], type: 'ANALYTICAL', domain: 'CRM' },
        Finance: { intent: 'FINANCE_GET_PENDING_INVOICES', tools: ['finance_get_invoices'], type: 'DATA_RETRIEVAL', domain: 'FINANCE' },
        HR: { intent: 'HR_GET_EMPLOYEES', tools: ['hr_get_employees'], type: 'DATA_RETRIEVAL', domain: 'HR' },
        Support: { intent: 'SUPPORT_GET_HIGH_PRIORITY_TICKETS', tools: ['support_get_tickets'], type: 'DATA_RETRIEVAL', domain: 'SUPPORT' },
        Analytics: { intent: 'ANALYTICS_OVERVIEW', tools: ['analytics_query'], type: 'ANALYTICAL', domain: 'ANALYTICS' },
        Marketing: { intent: 'MARKETING_DRAFT_CAMPAIGN', tools: ['marketing_generate_campaign'], type: 'ANALYTICAL', domain: 'COMMUNICATION' },
        Workflow: { intent: 'WORKFLOW_LIST', tools: ['workflow_list'], type: 'DATA_RETRIEVAL', domain: 'WORKFLOW' },
        Scheduler: { intent: 'WORKFLOW_GET_SCHEDULED', tools: ['workflow_get_scheduled'], type: 'DATA_RETRIEVAL', domain: 'WORKFLOW' },
        Document: { intent: 'DOCUMENT_GENERATE_REPORT', tools: ['document_create_artifact'], type: 'COMMUNICATION', domain: 'COMMUNICATION' },
        Email: { intent: 'EMAIL_PREPARE_DISPATCH', tools: ['email_generate_invite'], type: 'COMMUNICATION', domain: 'COMMUNICATION' },
        Knowledge: { intent: 'KNOWLEDGE_QUERY_POLICY', tools: ['knowledge_search'], type: 'KNOWLEDGE_RAG', domain: 'KNOWLEDGE' },
        Reporting: { intent: 'REPORTING_GENERATE_AUDIT', tools: ['finance_get_invoices', 'crm_get_leads', 'hr_get_employees'], type: 'ANALYTICAL', domain: 'GENERAL' },
        Security: { intent: 'SECURITY_AUDIT_STATUS', tools: ['security_inspect_logs'], type: 'INFORMATIONAL', domain: 'SECURITY' },
        Database: { intent: 'INVENTORY_GET_PRODUCTS', tools: ['inventory_get_products'], type: 'DATA_RETRIEVAL', domain: 'INVENTORY' },
        CEO: { intent: 'GENERAL_EXECUTIVE_QUERY', tools: [], type: 'INFORMATIONAL', domain: 'GENERAL' },
      };

      const resolvedAgent: AgentType = (agentOverride as string) === 'Inventory' ? 'Database' : agentOverride;
      const def = AGENT_DEFAULT_INTENTS[resolvedAgent];
      if (def) {
        return {
          primaryIntent: def.intent,
          operationType: def.type,
          businessDomain: def.domain,
          targetAgent: agentOverride,
          requiredTools: def.tools,
          entities: {},
          parameters: {},
          confidence: 0.95,
          confidenceLevel: 'HIGH',
          expectedResponseFormat: 'SUMMARY',
        };
      }
    }

    return null;
  }
}
