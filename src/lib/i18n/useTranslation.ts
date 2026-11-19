'use client';

import { useAppStore } from '@/lib/store/useAppStore';
import { LanguageCode, LanguageOption } from '@/types';
import {
  SIX_SUPPORTED_LANGUAGES,
  getSupportedLanguageOptions,
  formatCurrency as formatCurrencyUtil,
  formatDate as formatDateUtil,
  formatNumber as formatNumberUtil,
  persistLanguage,
  resolveLanguage,
} from './languageContextService';
import { getTranslation, UI_TRANSLATIONS } from './translations';
import { useCallback, useMemo } from 'react';

export function useTranslation() {
  const language = useAppStore((state) => state.language);
  const setStoreLanguage = useAppStore((state) => state.setLanguage);

  const activeLanguage = useMemo(() => resolveLanguage(language), [language]);

  const setLanguage = useCallback(
    (lang: LanguageCode) => {
      const resolved = resolveLanguage(lang);
      persistLanguage(resolved);
      setStoreLanguage(resolved);
    },
    [setStoreLanguage]
  );

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      return getTranslation(activeLanguage, key, params);
    },
    [activeLanguage]
  );

  const formatCurrency = useCallback(
    (amount: number): string => {
      return formatCurrencyUtil(amount, activeLanguage);
    },
    [activeLanguage]
  );

  const formatDate = useCallback(
    (
      date: Date | string | number,
      options?: Intl.DateTimeFormatOptions
    ): string => {
      return formatDateUtil(date, activeLanguage, options);
    },
    [activeLanguage]
  );

  const formatNumber = useCallback(
    (num: number): string => {
      return formatNumberUtil(num, activeLanguage);
    },
    [activeLanguage]
  );

  const supportedLanguages: LanguageOption[] = useMemo(
    () => getSupportedLanguageOptions(),
    []
  );

  const dict = useMemo(() => {
    return UI_TRANSLATIONS[activeLanguage] || UI_TRANSLATIONS.en;
  }, [activeLanguage]);

  return {
    t,
    language: activeLanguage,
    setLanguage,
    formatCurrency,
    formatDate,
    formatNumber,
    supportedLanguages,
    dict,
    dir: 'ltr' as const,
    isRTL: false,
  };
}
