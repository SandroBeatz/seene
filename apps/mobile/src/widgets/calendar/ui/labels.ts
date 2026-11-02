/** Words the calendar screens share. Month and weekday names come from i18n (Hermes' Intl has none). */
import type { TFunction } from 'i18next';
import { DateTime } from 'luxon';
import { formatAmount } from '@/shared/lib/formats';
import { pluralCategory, type AppLocale } from '@/shared/lib/i18n';
import type { CalendarEntry } from '../model/useCalendarData';

const names = (t: TFunction, key: string) => t(key, { returnObjects: true }) as unknown as string[];

/** "Ноябрь". */
export const monthName = (t: TFunction, monthKey: string) =>
  names(t, 'months')[Number(monthKey.slice(5, 7)) - 1];

/** "Пн" … "Вс", Monday first. */
export const weekdayNames = (t: TFunction) => names(t, 'weekdays.short');

/** "Понедельник, 2 ноября" (`short`: "Пн, 2 ноября"). */
export function dayTitle(t: TFunction, dayKey: string, short = false) {
  const day = DateTime.fromISO(dayKey);
  const weekday = names(t, short ? 'weekdays.short' : 'weekdays.long')[day.weekday - 1];
  return `${weekday}, ${day.day} ${names(t, 'monthsGenitive')[day.month - 1]}`;
}

export interface SummaryFormat {
  t: TFunction;
  locale: AppLocale;
  currency: string;
}

/** "7 записей · 14 900 сом", "Нет записей" or "Выходной". */
export function daySummary(
  entries: readonly CalendarEntry[] | undefined,
  working: boolean,
  { t, locale, currency }: SummaryFormat,
) {
  const visits = (entries ?? []).filter((e) => !e.continued).flatMap((e) => e.visit ?? []);
  if (visits.length === 0) return working ? t('calendar.noVisits') : t('calendar.dayOff');
  const sum = visits.reduce((total, v) => total + v.price, 0);
  const count = `${visits.length} ${t(`today.visits_${pluralCategory(visits.length, locale)}`)}`;
  return `${count} · ${formatAmount(sum, { currency, locale })}`;
}
