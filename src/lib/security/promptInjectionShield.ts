export interface PromptInjectionAnalysis {
  isThreat: boolean;
  threatType?: string;
  reason?: string;
  safeResponse: string;
  sanitizedInput: string;
}

const INJECTION_PATTERNS = [
  { pattern: /ignore\s+(all\s+)?(previous|system|above)\s+instructions/i, type: 'INSTRUCTION_OVERRIDE', reason: 'Attempted instruction override' },
  { pattern: /reveal\s+(your\s+)?(system\s+prompt|hidden\s+instructions|system\s+instructions)/i, type: 'PROMPT_LEAK', reason: 'Attempted prompt leak' },
  { pattern: /show\s+(me\s+)?(your\s+)?(system\s+prompt|hidden\s+instructions|secret\s+keys)/i, type: 'PROMPT_LEAK', reason: 'Attempted prompt leak' },
  { pattern: /act\s+as\s+(the\s+)?system|bypass\s+(user\s+)?approval/i, type: 'POLICY_BYPASS', reason: 'Attempted policy bypass' },
  { pattern: /print\s+(the\s+)?environment\s+variables|show\s+api\s+keys/i, type: 'SECRET_LEAK', reason: 'Attempted secret extraction' },
  { pattern: /you\s+are\s+now\s+in\s+developer\s+mode/i, type: 'MODE_JAILBREAK', reason: 'Attempted developer mode jailbreak' },
];

export const promptInjectionShield = {
  analyze(input: string, userLanguage: string = 'en'): PromptInjectionAnalysis {
    if (!input || typeof input !== 'string') {
      return {
        isThreat: false,
        safeResponse: '',
        sanitizedInput: '',
      };
    }

    const trimmed = input.trim();

    for (const rule of INJECTION_PATTERNS) {
      if (rule.pattern.test(trimmed)) {
        return {
          isThreat: true,
          threatType: rule.type,
          reason: rule.reason,
          safeResponse: getLocalizedSecurityResponse(userLanguage),
          sanitizedInput: '[SECURITY_BLOCKED_INPUT]',
        };
      }
    }

    // Strip potentially malicious script or HTML injection tags safely
    const sanitized = trimmed
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '');

    return {
      isThreat: false,
      safeResponse: '',
      sanitizedInput: sanitized,
    };
  },
};

function getLocalizedSecurityResponse(lang: string): string {
  switch (lang) {
    case 'te':
      return 'రక్షణ హెచ్చరిక: భద్రతా నిబంధనల ప్రకారం సిస్టమ్ ప్రాంప్ట్‌లు మరియు అంతర్గత సూచనలు బయటకు వ్యక్తపరచబడవు.';
    case 'hi':
      return 'सुरक्षा अलर्ट: सुरक्षा नीतियों के अनुसार सिस्टम प्रॉम्प्ट और आंतरिक निर्देश प्रकट नहीं किए जा सकते।';
    case 'ta':
      return 'பாதுகாப்பு விழிப்பூட்டல்: பாதுகாப்பு கொள்கைகளின்படி அமைப்புக் குறிப்புகள் வெளிப்படுத்தப்படாது.';
    case 'kn':
      return 'ಸುರಕ್ಷತಾ ಎಚ್ಚರಿಕೆ: ಭದ್ರತಾ ನೀತಿಗಳ ಪ್ರಕಾರ ಸಿಸ್ಟಮ್ ಸೂಚನೆಗಳನ್ನು ಬಹಿರಂಗಪಡಿಸಲಾಗುವುದಿಲ್ಲ.';
    case 'ml':
      return 'സുരക്ഷാ മുന്നറിയിപ്പ്: സുരക്ഷാ നയങ്ങൾ അനുസരിച്ച് സിസ്റ്റം നിർദ്ദേശങ്ങൾ വെളിപ്പെടുത്തില്ല.';
    default:
      return 'Security Alert: Prompt injection attempt detected and blocked. System prompts, API keys, and internal policy overrides are restricted under RBAC security policy.';
  }
}
