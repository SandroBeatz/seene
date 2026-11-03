/** A working day on the "Рабочие часы" screens. Pure. */
import type { DaySchedule, WeeklySchedule } from '@/entities/master';
import { copyMondayToWeekdays } from '@/shared/lib/scheduling';

const DEFAULT_START = '10:00';
const DEFAULT_END = '19:00';

const isRange = (r: { start: string; end: string }) => r.end > r.start;

/** Ends after it starts, and every break sits inside the day. "HH:mm" compares as text. */
export function isDayValid(day: DaySchedule): boolean {
  if (!day.enabled) return true;
  return (
    isRange(day) &&
    day.breaks.every((b) => isRange(b) && b.start >= day.start && b.end <= day.end)
  );
}

/** A day that was never set has 00:00–00:00: switching it on gives it real hours. */
export function setDayEnabled(day: DaySchedule, enabled: boolean): DaySchedule {
  if (!enabled || isRange(day)) return { ...day, enabled };
  return { ...day, enabled, start: DEFAULT_START, end: DEFAULT_END };
}

/** The week with one day replaced; `sameForWeekdays` passes Monday on to Tue–Fri. */
export function withDay(
  week: readonly DaySchedule[],
  index: number,
  day: DaySchedule,
  sameForWeekdays = false,
): WeeklySchedule {
  const next = week.map((d, i) => (i === index ? day : d));
  return (sameForWeekdays ? copyMondayToWeekdays(next) : next) as WeeklySchedule;
}
