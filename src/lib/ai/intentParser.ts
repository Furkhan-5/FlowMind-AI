import { AgentType, LanguageCode } from '@/types';

export interface CanonicalIntent {
  action: string;
  targetAgent: AgentType;
  confidence: number;
  parameters: Record<string, any>;
  summaryText: string;
}

const LOCALIZED_INTENT_SUMMARIES: Record<string, Record<LanguageCode, string>> = {
  SCHEDULE_SALES_MEETING: {
    en: "Scheduled sales meeting and updated CRM lead pipeline.",
    te: "సేల్స్ సమావేశాన్ని షెడ్యూల్ చేసి CRM లీడ్ పైప్‌లైన్‌ను నవీకరించాము.",
    hi: "बिक्री बैठक शेड्यूल की गई और CRM लीड पाइपलाइन को अपडेट किया गया।",
    ta: "விற்பனை கூட்டம் திட்டமிடப்பட்டு CRM வாய்ப்புகள் புதுப்பிக்கப்பட்டன.",
    kn: "ಮಾರಾಟ ಸಭೆಯನ್ನು ನಿಗದಿಪಡಿಸಲಾಗಿದೆ ಮತ್ತು CRM ಲೀಡ್‌ಗಳನ್ನು ನವೀಕರಿಸಲಾಗಿದೆ.",
    ml: "സെയിൽസ് മീറ്റിംഗ് നിശ്ചയിക്കുകയും CRM വിവരങ്ങൾ പുതുക്കുകയും ചെയ്തു.",
  },
  GENERATE_CLIENT_INVOICE: {
    en: "Calculated tax breakdown and generated invoice PDF draft.",
    te: "పన్ను వివరాలను గణించి ఇన్వాయిస్ PDF డ్రాఫ్ట్‌ను తయారు చేసాము.",
    hi: "कर विवरण की गणना की गई और इनवॉइस PDF ड्राफ्ट तैयार किया गया।",
    ta: "வரி விவரங்கள் கணக்கிடப்பட்டு இன்வாய்ஸ் PDF வரைவு உருவாக்கப்பட்டது.",
    kn: "ತೆರಿಗೆ ವಿವರಗಳನ್ನು ಲೆಕ್ಕಹಾಕಿ ಇನ್‌ವಾಯ್ಸ್ PDF ಕರಡನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ.",
    ml: "നികുതി കണക്കാക്കി ഇൻവോയ്സ് PDF ഡ്രാഫ്റ്റ് ഉണ്ടാക്കി.",
  },
  APPROVE_EMPLOYEE_LEAVE: {
    en: "Verified leave balance and processed HR approval.",
    te: "సెలవు నిల్వను పరిశీలించి HR ఆమోదాన్ని పూర్తి చేసాము.",
    hi: "छुट्टी के संतुलन की पुष्टि की गई और HR स्वीकृति संसाधित की गई।",
    ta: "விடுப்பு இருப்பு சரிபார்க்கப்பட்டு HR ஒப்புதல் பெறப்பட்டது.",
    kn: "ರಜೆ ಬಾಕಿಯನ್ನು ಪರಿಶೀಲಿಸಿ HR ಅನುಮೋದನೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಲಾಗಿದೆ.",
    ml: "അവധി വിവരങ്ങൾ പരിശോധിച്ച് HR അംഗീകാരം നൽകി.",
  },
  ANALYZE_INVENTORY_STOCK: {
    en: "Detected low stock levels and generated purchase order draft.",
    te: "తక్కువ నిల్వను గుర్తించి కొనుగోలు ఆర్డర్ డ్రాఫ్ట్‌ను సృష్టించాము.",
    hi: "कम स्टॉक स्तर का पता चला और खरीद ऑर्डर ड्राफ्ट तैयार किया गया।",
    ta: "குறைந்த இருப்பு கண்டறியப்பட்டு கொள்முதல் ஆணை வரைவு உருவாக்கப்பட்டது.",
    kn: "ಕಡಿಮೆ ದಾಸ್ತಾನು ಪತ್ತೆಹಚ್ಚಿ ಖರೀದಿ ಆದೇಶ ಕರಡನ್ನು ರಚಿಸಲಾಗಿದೆ.",
    ml: "കുറഞ്ഞ സ്റ്റോക്ക് കണ്ടെത്തി പർച്ചേസ് ഓർഡർ ഡ്രാഫ്റ്റ് ഉണ്ടാക്കി.",
  },
  EXECUTIVE_QUERY: {
    en: "Processed request across Analytics and Knowledge RAG agents.",
    te: "అనలిటిక్స్ మరియు నాలెడ్జ్ RAG ఏజెంట్ల ద్వారా మీ అభ్యర్థనను పూర్తి చేసాము.",
    hi: "एनालिटिक्स और नॉलेज RAG एजेंटों द्वारा अनुरोध को संसाधित किया गया।",
    ta: "பகுப்பாய்வு மற்றும் அறிவு RAG முகவர்கள் மூலம் கோரிக்கை செயலாக்கப்பட்டது.",
    kn: "ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಜ್ಞಾನ RAG ಏಜೆಂಟ್‌ಗಳ ಮೂಲಕ ವಿನಂತಿಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಲಾಗಿದೆ.",
    ml: "അനലിറ്റിക്സ്, നോളജ് RAG ഏജന്റുകൾ വഴി അഭ്യർത്ഥന പൂർത്തിയാക്കി.",
  },
};

export function parseCanonicalBusinessIntent(text: string, requestedLang: LanguageCode): CanonicalIntent {
  const lower = text.toLowerCase();
  let actionKey = 'EXECUTIVE_QUERY';
  let targetAgent: AgentType = 'CEO';
  let confidence = 0.88;
  let parameters: Record<string, any> = { query: text };

  // 1. Sales & Scheduling Intent
  if (
    lower.includes('meeting') ||
    lower.includes('मीटिंग') ||
    lower.includes('మీటింగ్') ||
    lower.includes('కూட்டம்') ||
    lower.includes('ಸಭೆ') ||
    lower.includes('മീറ്റിംഗ്') ||
    lower.includes('lead') ||
    lower.includes('సేల్స్') ||
    lower.includes('बिक्री')
  ) {
    actionKey = 'SCHEDULE_SALES_MEETING';
    targetAgent = 'Sales';
    confidence = 0.96;
    parameters = { time: 'Tomorrow 10:00 AM IST', type: 'Sales Review', attendees: 4 };
  }
  // 2. Invoicing & Finance Intent
  else if (
    lower.includes('invoice') ||
    lower.includes('इनवॉइस') ||
    lower.includes('ఇన్వాయిస్') ||
    lower.includes('இன்வாய்ஸ்') ||
    lower.includes('ಇನ್‌ವಾಯ್ಸ್') ||
    lower.includes('ഇൻവോയ്സ്') ||
    lower.includes('payroll') ||
    lower.includes('tax') ||
    lower.includes('పన్ను')
  ) {
    actionKey = 'GENERATE_CLIENT_INVOICE';
    targetAgent = 'Finance';
    confidence = 0.98;
    parameters = { client: 'Apex Tech Solutions', amount: 125000, taxRate: '18% GST' };
  }
  // 3. HR & Leave Approval Intent
  else if (
    lower.includes('leave') ||
    lower.includes('employee') ||
    lower.includes('छुट्टी') ||
    lower.includes('సెలవు') ||
    lower.includes('விடுப்பு') ||
    lower.includes('ರಜೆ')
  ) {
    actionKey = 'APPROVE_EMPLOYEE_LEAVE';
    targetAgent = 'HR';
    confidence = 0.92;
    parameters = { employee: 'Rajesh Kumar', leaveDays: 2, status: 'APPROVED' };
  }
  // 4. Inventory & Stock Alert Intent
  else if (
    lower.includes('stock') ||
    lower.includes('inventory') ||
    lower.includes('నిల్వ') ||
    lower.includes('இருப்பு') ||
    lower.includes('ದಾಸ್ತಾನು') ||
    lower.includes('ബാക്കി')
  ) {
    actionKey = 'ANALYZE_INVENTORY_STOCK';
    targetAgent = 'Document';
    confidence = 0.90;
    parameters = { sku: 'SKU-8802', reorderThreshold: 15, currentQty: 4 };
  }

  const summaries = LOCALIZED_INTENT_SUMMARIES[actionKey] || LOCALIZED_INTENT_SUMMARIES.EXECUTIVE_QUERY;
  const summaryText = summaries[requestedLang] || summaries.en;

  return {
    action: actionKey,
    targetAgent,
    confidence,
    parameters,
    summaryText,
  };
}
