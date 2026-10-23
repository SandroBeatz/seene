/**
 * Active-locale store (en/fr/ru). Persisted to MMKV; applies live (matching the
 * web's "language applies as you edit"). i18n.ts reads/initializes this.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvSyncStorage } from '@/shared/api/storage';

export const SUPPORTED_LOCALES = ['en', 'fr', 'ru'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

interface LocaleState {
  /** null = follow device locale. */
  locale: AppLocale | null;
  setLocale: (locale: AppLocale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: null,
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'seene.locale',
      storage: createJSONStorage(() => mmkvSyncStorage),
    },
  ),
);
