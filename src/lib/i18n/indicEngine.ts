import { LanguageCode } from '@/types';

// Language script range detector
export function detectLanguageScript(text: string): LanguageCode {
  if (!text) return 'en';

  // Telugu Unicode range: 0C00–0C7F
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  // Devanagari (Hindi) Unicode range: 0900–097F
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  // Tamil Unicode range: 0B80–0BFF
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  // Kannada Unicode range: 0C80–0CFF
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
  // Malayalam Unicode range: 0D00–0D7F
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';

  return 'en';
}

// Map language codes to BCP 47 speech synthesis tags
export const VOICE_LANG_TAGS: Record<LanguageCode, string> = {
  en: 'en-US',
  te: 'te-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
};

// Web Speech TTS Synthesis helper
export function speakTextInNativeAccent(text: string, lang: LanguageCode): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve(false);
      return;
    }

    window.speechSynthesis.cancel(); // stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = VOICE_LANG_TAGS[lang] || 'en-US';
    utterance.rate = 0.95; // comfortable speaking rate
    utterance.pitch = 1.0;

    utterance.onend = () => resolve(true);
    utterance.onerror = () => resolve(false);

    window.speechSynthesis.speak(utterance);
  });
}
