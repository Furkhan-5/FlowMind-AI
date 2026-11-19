import { LanguageCode, LanguageOption } from '@/types';
import { detectLanguageScript } from './indicEngine';

export type SupportedLanguageCode = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'ml';

export interface SupportedLanguageMeta {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  locale: string;
  script: 'Latin' | 'Devanagari' | 'Telugu' | 'Tamil' | 'Kannada' | 'Malayalam';
  scriptName: string;
  currencySymbol: string;
}

export const SIX_SUPPORTED_LANGUAGES: SupportedLanguageMeta[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    locale: 'en-IN',
    script: 'Latin',
    scriptName: 'English (Latin)',
    currencySymbol: '₹',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    locale: 'hi-IN',
    script: 'Devanagari',
    scriptName: 'हिन्दी (Devanagari)',
    currencySymbol: '₹',
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    locale: 'te-IN',
    script: 'Telugu',
    scriptName: 'తెలుగు (Telugu)',
    currencySymbol: '₹',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    locale: 'ta-IN',
    script: 'Tamil',
    scriptName: 'தமிழ் (Tamil)',
    currencySymbol: '₹',
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    flag: '🇮🇳',
    locale: 'kn-IN',
    script: 'Kannada',
    scriptName: 'ಕನ್ನಡ (Kannada)',
    currencySymbol: '₹',
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    flag: '🇮🇳',
    locale: 'ml-IN',
    script: 'Malayalam',
    scriptName: 'മലയാളം (Malayalam)',
    currencySymbol: '₹',
  },
];

export const VALID_LANGUAGE_CODES: LanguageCode[] = ['en', 'hi', 'te', 'ta', 'kn', 'ml'];

export function isSupportedLanguage(code: any): code is LanguageCode {
  return VALID_LANGUAGE_CODES.includes(code);
}

export function getLanguageMeta(lang: LanguageCode = 'en'): SupportedLanguageMeta {
  return (
    SIX_SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SIX_SUPPORTED_LANGUAGES[0]
  );
}

export function getSupportedLanguageOptions(): LanguageOption[] {
  return SIX_SUPPORTED_LANGUAGES.map((l) => ({
    code: l.code,
    name: l.name,
    nativeName: l.nativeName,
    flag: l.flag,
  }));
}

export function getLocaleTag(lang: LanguageCode = 'en'): string {
  const meta = getLanguageMeta(lang);
  return meta.locale || 'en-IN';
}

/**
 * Format currency in Indian numbering system (Lakhs / Crores) with ₹ symbol.
 */
export function formatCurrency(amount: number, lang: LanguageCode = 'en'): string {
  const locale = getLocaleTag(lang);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}

/**
 * Format date according to language locale
 */
export function formatDate(
  date: Date | string | number,
  lang: LanguageCode = 'en',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const locale = getLocaleTag(lang);
  try {
    return new Intl.DateTimeFormat(locale, options).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

/**
 * Format number in language locale
 */
export function formatNumber(num: number, lang: LanguageCode = 'en'): string {
  const locale = getLocaleTag(lang);
  try {
    return new Intl.NumberFormat(locale).format(num);
  } catch {
    return num.toLocaleString();
  }
}

// Romanized keyword patterns for conversational & business intents
const ROMANIZED_PATTERNS: Partial<Record<LanguageCode, RegExp[]>> = {
  te: [
    /\b(entha|unnayi|unnaayi|chupinchu|chupandi|chey|cheyandi|ekkada|emi|naa|undhi|undha|ivvandi|pampandi|kavali|cheyyi|cheyyandi|cheppandi)\b/i,
    /\b(invoices?|pending|overdue)\s+(entha|unnayi|chupinchu)\b/i,
    /\b(nenu|meeru|manaki|maku|chudandi)\b/i,
  ],
  hi: [
    /\b(kitne|kitna|hai|hain|dikhao|batao|karo|mere|meri|mera|kya|kaise|chahiye|bhejo|dekhna|hoga)\b/i,
    /\b(invoices?|pending|overdue)\s+(kitne|dikhao|batao)\b/i,
    /\b(hum|aap|mujhe|humein|kardo)\b/i,
  ],
  ta: [
    /\b(evvalavu|irukku|irukkirathu|kaattu|kaattunga|pannu|pannunga|ennathu|eppadi|solla|sollunga|enakku|engalukku|thevai)\b/i,
    /\b(invoices?|pending|overdue)\s+(evvalavu|kaattu|solla)\b/i,
  ],
  kn: [
    /\b(eshtu|ide|idhe|thorisu|thorisi|maadi|madi|yenu|enu|hege|namage|nange|beku|kodi|helu|heli)\b/i,
    /\b(invoices?|pending|overdue)\s+(eshtu|thorisu|helu)\b/i,
  ],
  ml: [
    /\b(ethra|undu|und|kanikku|kaannikku|cheyyuka|cheyoo|enthanu|entha|enganeya|venam|nalkuka|parayu|parayoo)\b/i,
    /\b(invoices?|pending|overdue)\s+(ethra|kanikku|parayu)\b/i,
  ],
  en: [],
};

/**
 * Detect language from text input.
 * First checks native Unicode script ranges.
 * If Latin script, checks Romanized vocabulary patterns.
 * Falls back to null if purely English or unknown.
 */
export function detectInputLanguage(text: string): LanguageCode | null {
  if (!text || typeof text !== 'string') return null;

  // 1. Check Unicode script ranges first (Native Indic scripts)
  const scriptDetected = detectLanguageScript(text);
  if (scriptDetected && scriptDetected !== 'en' && isSupportedLanguage(scriptDetected)) {
    return scriptDetected;
  }

  // 2. Check Romanized phonetic patterns
  for (const lang of ['te', 'hi', 'ta', 'kn', 'ml'] as LanguageCode[]) {
    const patterns = ROMANIZED_PATTERNS[lang];
    if (patterns && patterns.some((p) => p.test(text))) {
      return lang;
    }
  }

  return null;
}

/**
 * Resolve language code with fallback to 'en'.
 */
export function resolveLanguage(input?: any): LanguageCode {
  if (typeof input === 'string') {
    const cleaned = input.trim().toLowerCase();
    if (isSupportedLanguage(cleaned)) {
      return cleaned;
    }
  }
  return 'en';
}

const STORAGE_KEY = 'flowmind_language';
const COOKIE_NAME = 'flowmind_lang';

export function getPersistedLanguage(): LanguageCode {
  if (typeof window === 'undefined') {
    return 'en';
  }

  try {
    // 1. Check localStorage
    const local = localStorage.getItem(STORAGE_KEY);
    if (local && isSupportedLanguage(local)) {
      return local;
    }

    // 2. Check cookie
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const [key, val] = c.trim().split('=');
      if (key === COOKIE_NAME && val && isSupportedLanguage(val)) {
        return val;
      }
    }
  } catch (err) {
    console.warn('[LanguageContext] Failed to read persisted language:', err);
  }

  return 'en';
}

type LanguageChangeListener = (lang: LanguageCode) => void;
const listeners = new Set<LanguageChangeListener>();

export function subscribeLanguageChange(listener: LanguageChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyLanguageChange(lang: LanguageCode): void {
  listeners.forEach((listener) => {
    try {
      listener(lang);
    } catch (e) {
      console.error('[LanguageContext] Error in language listener:', e);
    }
  });
}

export function persistLanguage(lang: LanguageCode): void {
  const resolved = resolveLanguage(lang);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, resolved);
      // Persist in cookie for SSR and API requests (1 year expiry)
      document.cookie = `${COOKIE_NAME}=${resolved}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (err) {
      console.warn('[LanguageContext] Failed to persist language:', err);
    }
  }

  notifyLanguageChange(resolved);
}
