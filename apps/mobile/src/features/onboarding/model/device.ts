/** What the phone tells us about the master: zone, currency, region, language, theme. */
import { getLocales } from 'expo-localization';
import { i18n, isSupportedLocale } from '@/shared/lib/i18n';
import { deviceTimeZone } from '@/shared/lib/time-zone';
import { useThemeStore } from '@/shared/theme/theme.store';
import type { DeviceContext } from './payload';

export function deviceCurrency(): string {
  return getLocales()[0]?.currencyCode ?? 'USD';
}

export function readDeviceContext(): DeviceContext {
  const locale = getLocales()[0];
  return {
    timezone: deviceTimeZone(),
    region: locale?.regionCode ?? '',
    language: isSupportedLocale(i18n.language) ? i18n.language : 'en',
    theme: useThemeStore.getState().mode,
  };
}
