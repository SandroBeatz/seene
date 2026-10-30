/** Duration labels that need translations. */
import type { TFunction } from 'i18next';

/** 90 → "1 ч 30 мин", 20 → "20 мин", 120 → "2 ч". */
export function formatDurationLabel(minutes: number, t: TFunction): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const parts = [
    h ? t('duration.hours', { count: h }) : '',
    m || !h ? t('duration.minutes', { count: m }) : '',
  ];
  return parts.filter(Boolean).join(' ');
}
