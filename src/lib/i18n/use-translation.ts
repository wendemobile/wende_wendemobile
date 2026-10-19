import { useCallback } from 'react';
import { useI18nStore } from './store';
import { locales, TranslationKey } from './locales';

export function useTranslation() {
  const { locale } = useI18nStore();

  const t = useCallback((key: TranslationKey | string): string => {
    // If the key exists in our dictionary, return the translated text
    const dictionary = locales[locale]?.translations;
    if (dictionary && key in dictionary) {
      return dictionary[key as TranslationKey];
    }
    // Fallback to the key itself if translation is missing
    return key;
  }, [locale]);

  return { t, locale };
}
