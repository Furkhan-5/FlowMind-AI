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

// Web Speech STT Recognition helper
export interface SpeechRecognitionHandlers {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: any) => void;
  onEnd?: () => void;
}

export function startSpeechRecognition(
  lang: LanguageCode,
  handlers: SpeechRecognitionHandlers
): any {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn('Web Speech API is not supported in this browser environment.');
    return null;
  }

  // Request browser microphone permission if supported
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .catch((err) => console.warn('Microphone permission status:', err));
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // Default to browser language or requested Indic voice tag
    const preferredLang = VOICE_LANG_TAGS[lang] || navigator.language || 'en-US';
    recognition.lang = preferredLang;

    recognition.onresult = (event: any) => {
      let fullTranscript = '';
      let isFinalResult = false;

      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          isFinalResult = true;
        }
      }

      if (fullTranscript.trim()) {
        handlers.onResult(fullTranscript.trim(), isFinalResult);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition notice:', event.error);
      if (handlers.onError) handlers.onError(event);
    };

    recognition.onend = () => {
      if (handlers.onEnd) handlers.onEnd();
    };

    recognition.start();
    return recognition;
  } catch (err) {
    console.error('Failed to start Speech Recognition:', err);
    if (handlers.onError) handlers.onError(err);
    return null;
  }
}
