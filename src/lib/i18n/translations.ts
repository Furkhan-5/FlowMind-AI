import { LanguageOption, LanguageCode } from '@/types';
import enCommon from '@/locales/en/common.json';
import hiCommon from '@/locales/hi/common.json';
import teCommon from '@/locales/te/common.json';
import taCommon from '@/locales/ta/common.json';
import knCommon from '@/locales/kn/common.json';
import mlCommon from '@/locales/ml/common.json';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
];

const RAW_LOCALE_MAP: Record<string, Record<string, any>> = {
  en: enCommon,
  hi: hiCommon,
  te: teCommon,
  ta: taCommon,
  kn: knCommon,
  ml: mlCommon,
};

/**
 * Recursively flatten a nested dictionary into dot-separated keys
 * and also expose leaf keys directly when unambiguous.
 */
function flattenLocale(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenLocale(value, fullKey));
    } else if (typeof value === 'string') {
      result[fullKey] = value;
      // Also provide the short key for backward compatibility
      if (!result[key]) {
        result[key] = value;
      }
    }
  }

  return result;
}

const FLATTENED_LOCALES: Record<string, Record<string, string>> = {
  en: flattenLocale(enCommon),
  hi: flattenLocale(hiCommon),
  te: flattenLocale(teCommon),
  ta: flattenLocale(taCommon),
  kn: flattenLocale(knCommon),
  ml: flattenLocale(mlCommon),
};

export const UI_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: FLATTENED_LOCALES.en,
  hi: FLATTENED_LOCALES.hi,
  te: FLATTENED_LOCALES.te,
  ta: FLATTENED_LOCALES.ta,
  kn: FLATTENED_LOCALES.kn,
  ml: FLATTENED_LOCALES.ml,
};

export const AGENT_TRANSLATIONS: Record<string, Record<string, { name: string; domain: string }>> = {
  CEO: {
    en: { name: "CEO Master Agent", domain: "Executive Strategy" },
    te: { name: "CEO మాస్టర్ ఏజెంట్", domain: "కార్యనిర్వాహక వ్యూహం" },
    hi: { name: "CEO मास्टर एजेंट", domain: "कार्यकारी रणनीति" },
    ta: { name: "CEO தலைமை முகவர்", domain: "நிர்வாக உத்தி" },
    kn: { name: "CEO ಮಾಸ್ಟರ್ ಏಜೆಂಟ್", domain: "ಕಾರ್ಯನಿರ್ವಾಹಕ ತಂತ್ರಜ್ಞಾನ" },
    ml: { name: "CEO മാസ്റ്റർ ഏജന്റ്", domain: "എക്സിക്യൂട്ടീവ് സ്ട്രാറ്റജി" },
  },
  Sales: {
    en: { name: "Sales Agent", domain: "Sales & CRM" },
    te: { name: "సేల్స్ ఏజెంట్", domain: "సేల్స్ & CRM" },
    hi: { name: "सेल्स एजेंट", domain: "बिक्री और CRM" },
    ta: { name: "விற்பனை முகவர்", domain: "விற்பனை & CRM" },
    kn: { name: "ಸೇಲ್ಸ್ ಏಜೆಂಟ್", domain: "ಮಾರಾಟ ಮತ್ತು CRM" },
    ml: { name: "സെയിൽസ് ഏജന്റ്", domain: "വിൽപ്പന & CRM" },
  },
  Marketing: {
    en: { name: "Marketing Agent", domain: "Marketing" },
    te: { name: "మార్కెటింగ్ ఏజెంట్", domain: "మార్కెటింగ్" },
    hi: { name: "मार्केटिंग एजेंट", domain: "मार्केटिंग" },
    ta: { name: "சந்தைப்படுத்தல் முகவர்", domain: "சந்தைப்படுத்தல்" },
    kn: { name: "ಮಾರ್ಕೆಟಿಂಗ್ ಏಜೆಂಟ್", domain: "ಮಾರ್ಕೆಟಿಂಗ್" },
    ml: { name: "മാർക്കറ്റിംഗ് ഏജന്റ്", domain: "മാർക്കറ്റിംഗ്" },
  },
  Finance: {
    en: { name: "Finance Agent", domain: "Finance & Accounting" },
    te: { name: "ఫైనాన్స్ ఏజెంట్", domain: "ఆర్థిక & అకౌంటింగ్" },
    hi: { name: "फाइनेंस एजेंट", domain: "वित्त और लेखा" },
    ta: { name: "நிதி முகவர்", domain: "நிதி & கணக்கியல்" },
    kn: { name: "ಫೈನಾನ್ಸ್ ಏಜೆಂಟ್", domain: "ಹಣಕಾಸು ಮತ್ತು ಲೆಕ್ಕಪತ್ರ" },
    ml: { name: "ധനകാര്യ ഏജന്റ്", domain: "ധനകാര്യം & അക്കൗണ്ടിംഗ്" },
  },
  HR: {
    en: { name: "HR Agent", domain: "Human Resources" },
    te: { name: "HR ఏజెంట్", domain: "మానవ వనరులు" },
    hi: { name: "HR एजेंट", domain: "मानव संसाधन" },
    ta: { name: "HR முகவர்", domain: "மனித வளம்" },
    kn: { name: "HR ಏಜೆಂಟ್", domain: "ಮಾನವ ಸಂಪನ್ಮೂಲ" },
    ml: { name: "HR ഏജന്റ്", domain: "മനുഷ്യവിഭവശേഷി" },
  },
  Support: {
    en: { name: "Customer Support Agent", domain: "Customer Success" },
    te: { name: "కస్టమర్ సపోర్ట్ ఏజెంట్", domain: "వినియోగదారుల సహాయం" },
    hi: { name: "ग्राहक सहायता एजेंट", domain: "ग्राहक सफलता" },
    ta: { name: "வாடிக்கையாளர் ஆதரவு முகவர்", domain: "வாடிக்கையாளர் வெற்றி" },
    kn: { name: "ಗ್ರಾಹಕ ಬೆಂಬಲ ಏಜೆಂಟ್", domain: "ಗ್ರಾಹಕರ ಯಶಸ್ಸು" },
    ml: { name: "കസ്റ്റമർ സപ്പോർട്ട് ഏജന്റ്", domain: "ഉപഭോക്തൃ സംതൃപ്തി" },
  },
  Inventory: {
    en: { name: "Inventory Agent", domain: "Supply Chain & Stock" },
    te: { name: "ఇన్వెంటరీ ఏజెంట్", domain: "సరఫరా గొలుసు & స్టాక్" },
    hi: { name: "इन्वेंटरी एजेंट", domain: "आपूर्ति श्रृंखला और स्टॉक" },
    ta: { name: "சரக்கு முகவர்", domain: "விநியோகச் சங்கிலி & இருப்பு" },
    kn: { name: "ದಾಸ್ತಾನು ಏಜೆಂಟ್", domain: "ಪೂರೈಕೆ ಸರಪಳಿ ಮತ್ತು ಸರಕು" },
    ml: { name: "ഇൻവെന്ററി ഏജന്റ്", domain: "സപ്ലൈ ചെയിൻ & സ്റ്റോക്ക്" },
  },
  Workflow: {
    en: { name: "Workflow Planner Agent", domain: "Workflow Architecture" },
    te: { name: "వర్క్‌ఫ్లో ప్లానర్ ఏజెంట్", domain: "వర్క్‌ఫ్లో నిర్మాణం" },
    hi: { name: "वर्कफ़्लो प्लानर एजेंट", domain: "वर्कफ़्लो आर्किटेक्चर" },
    ta: { name: "பணிப்பாய்வு திட்டமிடல் முகவர்", domain: "பணிப்பாய்வு கட்டமைப்பு" },
    kn: { name: "ಕಾರ್ಯಪ್ರವಾಹ ಪ್ಲಾನರ್ ಏಜೆಂಟ್", domain: "ಕಾರ್ಯಪ್ರವಾಹ ವಿನ್ಯಾಸ" },
    ml: { name: "വർക്ക്ഫ്ലോ പ്ലാനർ ഏജന്റ്", domain: "വർക്ക്ഫ്ലോ ആർക്കിടെക്ചർ" },
  },
  Analytics: {
    en: { name: "Data Analyst Agent", domain: "Analytics & BI" },
    te: { name: "డేటా అనలిస్ట్ ఏజెంట్", domain: "విశ్లేషణ & BI" },
    hi: { name: "डेटा एनालिस्ट एजेंट", domain: "एनालिटिक्स और BI" },
    ta: { name: "தரவு பகுப்பாய்வாளர் முகவர்", domain: "பகுப்பாய்வு & BI" },
    kn: { name: "ಡೇಟಾ ವಿಶ್ಲೇಷಕ ಏಜೆಂಟ್", domain: "ವಿಶ್ಲೇಷಣೆ ಮತ್ತು BI" },
    ml: { name: "ഡാറ്റ അനലിസ്റ്റ് ഏജന്റ്", domain: "അനലിറ്റിക്സ് & BI" },
  },
  Scheduler: {
    en: { name: "Scheduler Agent", domain: "Automation & Cron" },
    te: { name: "షెడ్యూలర్ ఏజెంట్", domain: "ఆటోమేషన్ & క్రాన్" },
    hi: { name: "शेड्यूलर एजेंट", domain: "स्वचालन और क्रोन" },
    ta: { name: "திட்டமிடுபவர் முகவர்", domain: "தானியங்கு & கிரான்" },
    kn: { name: "ವೇಳಾಪಟ್ಟಿ ಏಜೆಂಟ್", domain: "ಸ್ವಯಂಚಾಲನೆ ಮತ್ತು ಕ್ರಾನ್" },
    ml: { name: "ഷെഡ്യൂളർ ഏജന്റ്", domain: "ഓട്ടോമേഷൻ & ക്രോൺ" },
  },
  Document: {
    en: { name: "Document Agent", domain: "Document AI" },
    te: { name: "డాక్యుమెంట్ ఏజెంట్", domain: "డాక్యుమెంట్ AI" },
    hi: { name: "दस्तावेज़ एजेंट", domain: "दस्तावेज़ AI" },
    ta: { name: "ஆவண முகவர்", domain: "ஆவணம் AI" },
    kn: { name: "ದಾಖಲೆ ಏಜೆಂಟ್", domain: "ಡಾಕ್ಯುಮೆಂಟ್ AI" },
    ml: { name: "ഡോക്യുമെന്റ് ഏജന്റ്", domain: "ഡോക്യുമെന്റ് AI" },
  },
  Email: {
    en: { name: "Email & Comm Agent", domain: "Communication" },
    te: { name: "ఈమెయిల్ & కమ్యూనికేషన్ ఏజెంట్", domain: "సమాచార మార్పిడి" },
    hi: { name: "ईमेल और संचार एजेंट", domain: "संचार" },
    ta: { name: "மின்னஞ்சல் & தொடர்பு முகவர்", domain: "தொடர்பு" },
    kn: { name: "ಇಮೇಲ್ ಮತ್ತು ಸಂವಹನ ಏಜೆಂಟ್", domain: "ಸಂವಹನ" },
    ml: { name: "ഇമെയിൽ & ആശയവിനിമയ ഏജന്റ്", domain: "ആശയവിനിമയം" },
  },
  Knowledge: {
    en: { name: "Knowledge RAG Agent", domain: "RAG Knowledge" },
    te: { name: "నాలెడ్జ్ RAG ఏజెంట్", domain: "RAG జ్ఞానం" },
    hi: { name: "नॉलेज RAG एजेंट", domain: "RAG ज्ञान" },
    ta: { name: "அறிவு RAG முகவர்", domain: "RAG அறிவு" },
    kn: { name: "ಜ್ಞಾನ RAG ಏಜೆಂಟ್", domain: "RAG ಜ್ಞಾನ" },
    ml: { name: "നോളജ് RAG ഏജന്റ്", domain: "RAG അറിവ്" },
  },
  Reporting: {
    en: { name: "Reporting Agent", domain: "Reporting" },
    te: { name: "రిపోర్టింగ్ ఏజెంట్", domain: "నివేదికలు" },
    hi: { name: "रिपोर्टिंग एजेंट", domain: "रिपोर्टिंग" },
    ta: { name: "அறிக்கை முகவர்", domain: "அறிக்கையிடல்" },
    kn: { name: "ವರದಿ ಏಜೆಂಟ್", domain: "ವರದಿ ಮಾಡುವಿಕೆ" },
    ml: { name: "റിപ്പോർട്ടിംഗ് ഏജന്റ്", domain: "റിപ്പോർട്ടിംഗ്" },
  },
  Security: {
    en: { name: "Security Agent", domain: "Security & Compliance" },
    te: { name: "సెక్యూరిటీ ఏజెంట్", domain: "రక్షణ & సమ్మతి" },
    hi: { name: "सुरक्षा एजेंट", domain: "सुरक्षा और अनुपालन" },
    ta: { name: "பாதுகாப்பு முகவர்", domain: "பாதுகாப்பு & இணக்கம்" },
    kn: { name: "ಸುರಕ್ಷತೆ ಏಜೆಂಟ್", domain: "ಸುರಕ್ಷತೆ ಮತ್ತು ಅನುಸರಣೆ" },
    ml: { name: "സെക്യൂരിറ്റി ഏജന്റ്", domain: "സുരക്ഷ & നിയമങ്ങൾ" },
  },
};

/**
 * Get translation with dot-notation or flat key support and parameter replacement.
 */
export function getTranslation(
  lang: LanguageCode,
  key: string,
  params?: Record<string, string | number>
): string {
  const currentLang = FLATTENED_LOCALES[lang] ? lang : 'en';
  const targetDict = FLATTENED_LOCALES[currentLang] || FLATTENED_LOCALES.en;
  const englishDict = FLATTENED_LOCALES.en;

  let text = targetDict[key] || englishDict[key];

  // If not found directly, attempt object navigation in the raw JSON
  if (!text && key.includes('.')) {
    const raw = RAW_LOCALE_MAP[currentLang] || RAW_LOCALE_MAP.en;
    const parts = key.split('.');
    let curr: any = raw;
    for (const p of parts) {
      if (curr && typeof curr === 'object') {
        curr = curr[p];
      } else {
        curr = undefined;
        break;
      }
    }
    if (typeof curr === 'string') {
      text = curr;
    } else {
      // Fallback to English raw
      let enCurr: any = RAW_LOCALE_MAP.en;
      for (const p of parts) {
        if (enCurr && typeof enCurr === 'object') {
          enCurr = enCurr[p];
        } else {
          enCurr = undefined;
          break;
        }
      }
      if (typeof enCurr === 'string') {
        text = enCurr;
      }
    }
  }

  if (!text) {
    return key;
  }

  if (params) {
    for (const [pKey, pVal] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    }
  }

  return text;
}

export function getLocalizedAgentName(agentId: string, lang: LanguageCode): string {
  const loc = AGENT_TRANSLATIONS[agentId]?.[lang] || AGENT_TRANSLATIONS[agentId]?.en;
  return loc?.name || `${agentId} Agent`;
}

export function getLocalizedAgentDomain(agentId: string, lang: LanguageCode): string {
  const loc = AGENT_TRANSLATIONS[agentId]?.[lang] || AGENT_TRANSLATIONS[agentId]?.en;
  return loc?.domain || agentId;
}
