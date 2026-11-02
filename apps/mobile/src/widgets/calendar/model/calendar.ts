/**
 * Pure calendar math (design "Таб · Календарь", "Календарь, день"): the months of the
 * list, entries grouped by the master's local day, a month cell's bars and a day's free
 * cells. Times inside a day are minutes from its midnight, on the master's clock.
 */
import { DateTime } from 'luxon';
import type { WorkdayHours } from '@/shared/lib/scheduling';

const DAY_MINUTES = 24 * 60;
/** The timeline's grid draws a line every half hour. */
export const CELL_MINUTES = 30;
/** A cell fits three bars, or two and "+N". */
const MAX_BARS = 3;

/** "yyyy-MM" of a day key. */
export const monthKeyOf = (dayKey: string) => dayKey.slice(0, 7);

/** `past` months before `center`, it, and `future` months after, in order. */
export function monthRange(center: string, past: number, future: number): string[] {
  const start = DateTime.fromISO(`${center}-01`);
  return Array.from({ length: past + future + 1 }, (_, i) =>
    start.plus({ months: i - past }).toFormat('yyyy-MM'),
  );
}

/** Weeks a month's grid takes in a Monday-first calendar. */
export function monthRows(monthKey: string): number {
  const first = DateTime.fromISO(`${monthKey}-01`);
  return Math.ceil((first.weekday - 1 + first.daysInMonth!) / 7);
}

/** Every day key of a month. */
export function daysOfMonth(monthKey: string): string[] {
  const first = DateTime.fromISO(`${monthKey}-01`);
  return Array.from({ length: first.daysInMonth! }, (_, i) =>
    first.plus({ days: i }).toFormat('yyyy-MM-dd'),
  );
}

/** A month as a UTC range in the master's zone: [its first midnight, the next month's). */
export function monthBounds(monthKey: string, zone: string) {
  const start = DateTime.fromISO(`${monthKey}-01`, { zone });
  return {
    start: start.toUTC().toISO()!,
    end: start.plus({ months: 1 }).toUTC().toISO()!,
  };
}

/** A month and its neighbours, without repeats: what to have loaded around `months`. */
export function withNeighbours(months: readonly string[]): string[] {
  return [...new Set(months.flatMap((m) => monthRange(m, 1, 1)))].sort();
}

export interface DayEntry<V, B> {
  kind: 'visit' | 'block';
  id: string;
  /** Minutes from the day's midnight, clipped to the day. */
  from: number;
  to: number;
  allDay: boolean;
  /** The rest of a visit that began the day before: takes time, isn't counted again. */
  continued: boolean;
  visit?: V;
  block?: B;
}

export type DayIndex<V, B> = ReadonlyMap<string, DayEntry<V, B>[]>;

interface GroupInput<V, B> {
  zone: string;
  visits: readonly { value: V; id: string; start_at: string; duration: number }[];
  blocks: readonly { value: B; id: string; start_at: string; end_at: string; all_day: boolean }[];
}

const minutesOf = (dt: DateTime) => dt.hour * 60 + dt.minute;

/**
 * Entries by local day, each day sorted by start. Visits and personal time appear on
 * every day they touch, clipped to it.
 */
export function groupByDay<V, B>({ zone, visits, blocks }: GroupInput<V, B>): DayIndex<V, B> {
  const index = new Map<string, DayEntry<V, B>[]>();
  const add = (day: string, entry: DayEntry<V, B>) => {
    const list = index.get(day);
    if (list) list.push(entry);
    else index.set(day, [entry]);
  };

  for (const { value, id, start_at, duration } of visits) {
    const start = DateTime.fromISO(start_at, { zone: 'utc' }).setZone(zone);
    const end = start.plus({ minutes: Math.max(duration, 1) });
    for (let day = start.startOf('day'); day < end; day = day.plus({ days: 1 })) {
      const next = day.plus({ days: 1 });
      add(day.toFormat('yyyy-MM-dd'), {
        kind: 'visit',
        id,
        from: start > day ? minutesOf(start) : 0,
        to: end < next ? minutesOf(end) : DAY_MINUTES,
        allDay: false,
        continued: start < day,
        visit: value,
      });
    }
  }

  for (const { value, id, start_at, end_at, all_day } of blocks) {
    const start = DateTime.fromISO(start_at, { zone: 'utc' }).setZone(zone);
    const end = DateTime.fromISO(end_at, { zone: 'utc' }).setZone(zone);
    for (
      let day = start.startOf('day');
      day < end || day.hasSame(start, 'day');
      day = day.plus({ days: 1 })
    ) {
      const next = day.plus({ days: 1 });
      add(day.toFormat('yyyy-MM-dd'), {
        kind: 'block',
        id,
        from: start > day ? minutesOf(start) : 0,
        to: end < next ? minutesOf(end) : DAY_MINUTES,
        allDay: all_day,
        continued: false,
        block: value,
      });
    }
  }

  for (const list of index.values()) list.sort((a, b) => a.from - b.from || a.to - b.to);
  return index;
}

/** A month cell's bars and how many didn't fit. */
export function cellBars<T>(entries: readonly T[]): { shown: T[]; more: number } {
  const fit = entries.length > MAX_BARS ? MAX_BARS - 1 : MAX_BARS;
  return { shown: entries.slice(0, fit), more: Math.max(entries.length - fit, 0) };
}

export const parseHhmm = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** A working day in minutes, or null on a day off. */
export function workMinutes(workday: WorkdayHours | null | undefined): [number, number] | null {
  if (!workday?.enabled) return null;
  const from = parseHhmm(workday.start);
  const to = parseHhmm(workday.end);
  return from < to ? [from, to] : null;
}

export interface FreeCellInput {
  work: [number, number];
  /** Taken time: visits, personal time, breaks. */
  busy: readonly (readonly [number, number])[];
  /** Offer nothing starting before this minute (now, on the current day). */
  after: number;
}

/** Starts of the grid's half-hour cells that are wholly free within a working day. */
export function freeCells({ work, busy, after }: FreeCellInput): number[] {
  const first = Math.ceil(Math.max(work[0], after) / CELL_MINUTES) * CELL_MINUTES;
  const cells: number[] = [];
  for (let from = first; from + CELL_MINUTES <= work[1]; from += CELL_MINUTES) {
    if (!busy.some(([a, b]) => from < b && from + CELL_MINUTES > a)) cells.push(from);
  }
  return cells;
}

/**
 * What the timeline shades on a working day: before opening, after closing and breaks,
 * in hours. On a day off, all of it.
 */
export function unavailableHours(
  workday: WorkdayHours | null | undefined,
): { start: number; end: number }[] {
  const work = workMinutes(workday);
  if (!work) return [{ start: 0, end: 24 }];
  const spans: [number, number][] = [
    [0, work[0]],
    [work[1], DAY_MINUTES],
    ...(workday?.breaks ?? []).map((b): [number, number] => [parseHhmm(b.start), parseHhmm(b.end)]),
  ];
  return spans.filter(([a, b]) => a < b).map(([a, b]) => ({ start: a / 60, end: b / 60 }));
}

/** Minutes of a day as the timeline's wall-clock string. Midnight at the end stays in the day. */
export function timelineStamp(dayKey: string, minutes: number): string {
  const m = Math.min(minutes, DAY_MINUTES);
  if (m === DAY_MINUTES) return `${dayKey} 23:59:59`;
  const hh = String(Math.floor(m / 60)).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  return `${dayKey} ${hh}:${mm}:00`;
}
