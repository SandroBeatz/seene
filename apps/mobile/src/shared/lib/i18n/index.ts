/**
 * i18next setup for en/fr/ru. Initial language = persisted choice, else the device
 * locale (expo-localization), else English. All visible text goes through this
 * (hard rule — docs/mobile-architecture.md §10). Import once at app start.
 */
/* eslint-disable import/no-named-as-default-member -- calling methods on the default i18next instance is intended */
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';
import ru from './locales/ru.json';
import { type AppLocale, isSupportedLocale, useLocaleStore } from './locale.store';

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ru: { translation: ru },
} as const;

function resolveInitialLocale(): AppLocale {
  const stored = useLocaleStore.getState().locale;
  if (stored) return stored;
  const device = getLocales()[0]?.languageCode ?? 'en';
  return isSupportedLocale(device) ? device : 'en';
}

export function initI18n(): typeof i18n {
  if (i18n.isInitialized) return i18n;

  i18n.use(initReactI18next).init({
    resources,
    lng: resolveInitialLocale(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  // Keep i18next in sync when the locale store changes (settings screen).
  useLocaleStore.subscribe((state) => {
    const next = state.locale ?? resolveInitialLocale();
    if (i18n.language !== next) void i18n.changeLanguage(next);
  });

  return i18n;
}

export { default as i18n } from 'i18next';
export { useLocaleStore, type AppLocale, SUPPORTED_LOCALES } from './locale.store';
