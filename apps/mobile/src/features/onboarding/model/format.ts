/** Onboarding display helpers that need translations (durations, hours, lists). */
import type { TFunction } from 'i18next';
import { pluralCategory, type AppLocale } from '@/shared/lib/i18n';
import { sameSummary, workingDayCount, type WorkingHours } from './hours';

/** 90 → "1 ч 30 мин", 20 → "20 мин", 120 → "2 ч". */
export function formatDurationLabel(minutes: number, t: TFunction): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const parts = [
    h ? t('onboarding.duration.hours', { count: h }) : '',
    m || !h ? t('onboarding.duration.minutes', { count: m }) : '',
  ];
  return parts.filter(Boolean).join(' ');
}

/** "Пн–Сб, 10–19" for one schedule, else "5 рабочих дней". */
export function formatHoursLabel(hours: WorkingHours, t: TFunction, locale: AppLocale): string {
  const short = t('weekdays.short', { returnObjects: true }) as string[];
  const days = workingDayCount(hours);
  return (
    sameSummary(hours, short) ??
    t(`onboarding.settings.workDays_${pluralCategory(days, locale)}`, { count: days })
  );
}

/** ["Маникюр", "Педикюр"] → "Маникюр, педикюр". */
export function formatSentenceList(labels: readonly string[], locale: AppLocale): string {
  return labels.map((label, i) => (i ? label.toLocaleLowerCase(locale) : label)).join(', ');
}
