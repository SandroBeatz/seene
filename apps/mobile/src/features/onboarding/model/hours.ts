/**
 * Working hours on step 3, pure. Two modes, as in the hours sheet: "Одинаково"
 * (one set of hours + breaks for the picked weekdays) and "По дням" (each day its
 * own). Both are kept, so switching back and forth loses nothing; `toWeek` reads
 * the active one.
 */
import type { DaySchedule, TimeRange, WeeklySchedule } from '@/entities/master';

export type HoursMode = 'same' | 'days';

export interface SameHours {
  /** Monday-first. */
  days: boolean[];
  start: string;
  end: string;
  breaks: TimeRange[];
}

export interface WorkingHours {
  mode: HoursMode;
  same: SameHours;
  perDay: DaySchedule[];
  /** Per-day hours were edited — switching modes must not overwrite them. */
  perDayEdited: boolean;
}

const LUNCH: TimeRange = { start: '13:00', end: '14:00' };

/** Design defaults: Mon–Sat, 10:00–19:00, lunch 13–14. */
export const DEFAULT_SAME: SameHours = {
  days: [true, true, true, true, true, true, false],
  start: '10:00',
  end: '19:00',
  breaks: [LUNCH],
};

export function expandSame(same: SameHours): DaySchedule[] {
  return same.days.map((enabled) => ({
    enabled,
    start: same.start,
    end: same.end,
    breaks: same.breaks.map((b) => ({ ...b })),
  }));
}

export const DEFAULT_HOURS: WorkingHours = {
  mode: 'same',
  same: DEFAULT_SAME,
  perDay: expandSame(DEFAULT_SAME),
  perDayEdited: false,
};

export function toWeek(hours: WorkingHours): WeeklySchedule {
  return (hours.mode === 'same' ? expandSame(hours.same) : hours.perDay) as WeeklySchedule;
}

export function workingDayCount(hours: WorkingHours): number {
  return toWeek(hours).filter((d) => d.enabled).length;
}

const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

/** A working day ends before it starts, or a break does — not a schedule we can save. */
export function hasInvalidRange(hours: WorkingHours): boolean {
  const bad = (r: { start: string; end: string }) => toMinutes(r.end) <= toMinutes(r.start);
  return toWeek(hours).some((d) => d.enabled && (bad(d) || d.breaks.some(bad)));
}

/** "Пн–Сб", "Пн, Вт, Пт", "Пн–Ср, Пт–Вс" from Monday-first flags and short names. */
export function dayRuns(days: readonly boolean[], short: readonly string[]): string {
  const runs: [number, number][] = [];
  days.forEach((on, i) => {
    if (!on) return;
    const last = runs[runs.length - 1];
    if (last && last[1] === i - 1) last[1] = i;
    else runs.push([i, i]);
  });
  return runs
    .map(([a, b]) =>
      a === b ? short[a] : b - a === 1 ? `${short[a]}, ${short[b]}` : `${short[a]}–${short[b]}`,
    )
    .join(', ');
}

/** "10:00" → "10", "10:30" → "10:30" (the design's compact hours). */
export const compactTime = (time: string) =>
  time.endsWith(':00') ? String(Number(time.slice(0, 2))) : time;

/** "Пн–Сб, 10–19" for "Одинаково"; null in "По дням" (callers show a day count). */
export function sameSummary(hours: WorkingHours, short: readonly string[]): string | null {
  if (hours.mode !== 'same') return null;
  const days = dayRuns(hours.same.days, short);
  return days ? `${days}, ${compactTime(hours.same.start)}–${compactTime(hours.same.end)}` : '';
}

const toClock = (minutes: number) => {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** The design's next break: lunch first, then 30 min starting 2 h after the last. */
export function nextBreak(breaks: readonly TimeRange[]): TimeRange {
  const last = breaks[breaks.length - 1];
  if (!last) return { ...LUNCH };
  const start = toMinutes(last.end) + 120;
  return { start: toClock(start), end: toClock(start + 30) };
}

/** "Скопировать понедельник на все будни" (Tue–Fri take Monday's hours). */
export function copyMondayToWeekdays(days: readonly DaySchedule[]): DaySchedule[] {
  const monday = days[0]!;
  return days.map((day, i) =>
    i >= 1 && i <= 4 ? { ...monday, breaks: monday.breaks.map((b) => ({ ...b })) } : day,
  );
}
