import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LocaleKey } from './locales';

interface I18nState {
  locale: LocaleKey;
  setLocale: (locale: LocaleKey) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'pos-i18n-storage',
    }
  )
);
