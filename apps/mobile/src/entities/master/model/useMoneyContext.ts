/**
 * What every money screen reads: the master's zone and currency, the app language,
 * and amounts formatted from them ("51 300 сом", "51 300").
 */
import { useTranslation } from 'react-i18next';
import { currencySymbol, formatAmount } from '@/shared/lib/formats';
import type { AppLocale } from '@/shared/lib/i18n';
import { deviceTimeZone } from '@/shared/lib/time-zone';
import { parseStoredSchedule } from '../lib/schedule';
import { useMasterProfileQuery, useMasterSettingsQuery } from './queries';

// Not `isSupportedLocale`: that module opens MMKV, and this barrel is loaded by pure tests.
const LOCALES: readonly string[] = ['en', 'fr', 'ru'] satisfies AppLocale[];

export function useMoneyContext(userId: string) {
  const { i18n } = useTranslation();
  const profile = useMasterProfileQuery(userId);
  const settings = useMasterSettingsQuery(userId);
  const locale = (LOCALES.includes(i18n.language) ? i18n.language : 'en') as AppLocale;
  const currency = settings.data?.currency ?? 'EUR';
  const zone = parseStoredSchedule(profile.data?.schedule)?.timezone ?? deviceTimeZone();
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });

  return {
    zone,
    locale,
    timeFormat: settings.data?.time_format === 12 ? (12 as const) : (24 as const),
    currency,
    currencyLabel: currencySymbol(currency, locale),
    /** "51 300". */
    number: (amount: number) => number.format(amount),
    /** "51 300 сом". */
    money: (amount: number) => formatAmount(amount, { currency, locale }),
  };
}
