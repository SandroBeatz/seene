/**
 * The period shared by "Аналитика", "Операции" and "Клиенты за период": it lives in a
 * store so the sub-pages and the date sheet read the one on screen. Until the master
 * picks one it's the current month; a chosen one is forgotten when the app restarts.
 */
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { create } from 'zustand';
import {
  canStepForward,
  currentPeriod,
  periodRange,
  shiftPeriod,
  type Period,
  type PeriodUnit,
} from '@/entities/analytics';
import { useMoneyContext } from '@/entities/master';
import { useUserId } from '@/entities/session';
import { useNow } from '@/shared/ui';

const usePeriodStore = create<{ period: Period | null; set: (period: Period) => void }>((set) => ({
  period: null,
  set: (period) => set({ period }),
}));

/** "Октябрь 2026", "26 окт – 1 ноя", "5–18 октября", "2026". */
export function usePeriodName() {
  const { t } = useTranslation();
  const months = t('months', { returnObjects: true }) as string[];
  const genitive = t('monthsGenitive', { returnObjects: true }) as string[];
  const short = t('monthsShort', { returnObjects: true }) as string[];
  return (period: Period) => {
    const start = DateTime.fromISO(period.startKey, { zone: 'utc' });
    const end = DateTime.fromISO(period.endKey, { zone: 'utc' });
    if (period.unit === 'year') return String(start.year);
    if (period.unit === 'month') return `${months[start.month - 1]} ${start.year}`;
    if (start.hasSame(end, 'month')) {
      return `${start.day}–${end.day} ${genitive[end.month - 1]}`;
    }
    const year = start.year === end.year ? '' : ` ${start.year}`;
    return `${start.day} ${short[start.month - 1]}${year} – ${end.day} ${short[end.month - 1]}${year && ` ${end.year}`}`;
  };
}

export function usePeriod() {
  const userId = useUserId() ?? '';
  const { zone } = useMoneyContext(userId);
  const now = useNow();
  const stored = usePeriodStore((state) => state.period);
  const setPeriod = usePeriodStore((state) => state.set);

  const todayKey = DateTime.fromMillis(now, { zone }).toISODate()!;
  const period = stored ?? currentPeriod('month', todayKey, zone);
  const range = periodRange(period, todayKey, zone);

  return {
    userId,
    zone,
    todayKey,
    period,
    range,
    canGoNext: canStepForward(period, todayKey),
    pickUnit: (unit: Exclude<PeriodUnit, 'custom'>) =>
      setPeriod(currentPeriod(unit, todayKey, zone)),
    step: (direction: 1 | -1) => setPeriod(shiftPeriod(period, direction, zone)),
    setPeriod,
  };
}
