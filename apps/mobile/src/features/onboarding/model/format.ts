/** Onboarding display helpers that need translations (durations, hours, lists). */
import type { TFunction } from 'i18next';
import { pluralCategory, type AppLocale } from '@/shared/lib/i18n';
import { sameSummary, workingDayCount, type WorkingHours } from './hours';

export { formatDurationLabel } from '@/shared/lib/i18n';

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
