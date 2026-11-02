/**
 * Pure availability/scheduling math — the app's core (RS-1/RS-2).
 *
 * Built: the day bounds and the day timeline the "Сегодня" schedule and the calendar
 * day view render (appointments, schedule breaks, personal time, the "now" line).
 * Also the grid of start times of a day with their state ("Новая запись", moving a
 * visit) and how full a day is.
 *
 * This module must never import from `entities/*` — it composes appointments and
 * time-blocks through minimal structural shapes and therefore lives in `shared`.
 */
import { DateTime } from 'luxon';

export interface TimeInterval {
  /** UTC ISO */
  start: string;
  /** UTC ISO */
  end: string;
}

/** One working day of `master_profile.schedule` (structurally `DaySchedule`). */
export interface WorkdayHours {
  enabled: boolean;
  start: string; // "HH:mm"
  end: string; // "HH:mm"
  breaks: { start: string; end: string }[];
}

export interface TimedRecord {
  id: string;
  start_at: string; // UTC ISO
  duration: number; // minutes
}

export interface BlockRecord {
  id: string;
  start_at: string; // UTC ISO
  end_at: string; // UTC ISO
  all_day: boolean;
}

export type TimelineItem<A extends TimedRecord, B extends BlockRecord> =
  | ({ kind: 'appointment'; record: A } & TimeInterval)
  | ({ kind: 'block'; record: B; allDay: boolean } & TimeInterval)
  | { kind: 'now'; at: string };

/** UTC range of a calendar day in a zone: [start of day, start of next day). DST-safe. */
export function dayBounds(dayKey: string, zone: string): TimeInterval {
  const start = DateTime.fromISO(dayKey, { zone }).startOf('day');
  if (!start.isValid) throw new Error(`Invalid day/zone: ${dayKey} ${zone}`);
  return { start: start.toUTC().toISO()!, end: start.plus({ days: 1 }).toUTC().toISO()! };
}

/** Index into a Monday-first week (0 = Monday … 6 = Sunday) for a day key. */
export function weekdayIndex(dayKey: string): number {
  return DateTime.fromISO(dayKey).weekday - 1;
}

/** "HH:mm" on `dayKey` in `zone` → UTC ISO. */
function wallTimeUtc(dayKey: string, hhmm: string, zone: string): string {
  const [hour, minute] = hhmm.split(':').map(Number);
  const dt = DateTime.fromISO(dayKey, { zone }).set({ hour, minute, second: 0, millisecond: 0 });
  return dt.toUTC().toISO()!;
}

/** The working hours of a day as UTC, or `null` on a day off. */
export function workingHours(
  dayKey: string,
  zone: string,
  workday: WorkdayHours | null | undefined,
): TimeInterval | null {
  if (!workday?.enabled) return null;
  return {
    start: wallTimeUtc(dayKey, workday.start, zone),
    end: wallTimeUtc(dayKey, workday.end, zone),
  };
}

const ms = (iso: string) => new Date(iso).getTime();
const maxIso = (a: string, b: string) => (ms(a) >= ms(b) ? a : b);
const minIso = (a: string, b: string) => (ms(a) <= ms(b) ? a : b);

/** Same-start order: personal time, then visits. */
const KIND_ORDER = { block: 1, appointment: 2 } as const;

export interface BuildDayTimelineInput<A extends TimedRecord, B extends BlockRecord> {
  dayKey: string;
  zone: string;
  /** Already filtered to what the schedule shows. */
  appointments: readonly A[];
  blocks: readonly B[];
  now: number;
}

/**
 * The day as one ordered list. Appointments and personal time that overlap the day
 * are kept (a block spilling over midnight is clipped to the day). The "now" line is
 * added on the current day only, before the first item that starts after now — so it
 * sits under an ongoing visit.
 */
export function buildDayTimeline<A extends TimedRecord, B extends BlockRecord>({
  dayKey,
  zone,
  appointments,
  blocks,
  now,
}: BuildDayTimelineInput<A, B>): TimelineItem<A, B>[] {
  const day = dayBounds(dayKey, zone);
  const overlapsDay = (start: string, end: string) =>
    ms(start) < ms(day.end) && ms(end) > ms(day.start);

  const items: Exclude<TimelineItem<A, B>, { kind: 'now' }>[] = [];

  for (const record of appointments) {
    const end = new Date(ms(record.start_at) + record.duration * 60_000).toISOString();
    if (overlapsDay(record.start_at, end)) {
      items.push({ kind: 'appointment', record, start: record.start_at, end });
    }
  }

  for (const record of blocks) {
    if (!overlapsDay(record.start_at, record.end_at)) continue;
    items.push({
      kind: 'block',
      record,
      allDay: record.all_day,
      start: maxIso(record.start_at, day.start),
      end: minIso(record.end_at, day.end),
    });
  }

  items.sort((a, b) => {
    const allDayA = a.kind === 'block' && a.allDay ? 0 : 1;
    const allDayB = b.kind === 'block' && b.allDay ? 0 : 1;
    if (allDayA !== allDayB) return allDayA - allDayB;
    return ms(a.start) - ms(b.start) || KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
  });

  const timeline: TimelineItem<A, B>[] = items;
  if (now >= ms(day.start) && now < ms(day.end)) {
    const after = items.findIndex(
      (item) => !(item.kind === 'block' && item.allDay) && ms(item.start) > now,
    );
    const marker = { kind: 'now' as const, at: new Date(now).toISOString() };
    timeline.splice(after === -1 ? items.length : after, 0, marker);
  }
  return timeline;
}

/**
 * The timed item happening at `now` and how far along it is (0–1), for a "now" line
 * drawn across its card. Of overlapping items, the one that started last.
 */
export function ongoingItem<A extends TimedRecord, B extends BlockRecord>(
  timeline: readonly TimelineItem<A, B>[],
  now: number,
): { id: string; ratio: number } | null {
  let found: { id: string; ratio: number; start: number } | null = null;
  for (const item of timeline) {
    if (item.kind === 'now' || (item.kind === 'block' && item.allDay)) continue;
    const start = ms(item.start);
    const end = ms(item.end);
    if (now >= start && now < end && (!found || start >= found.start)) {
      found = { id: item.record.id, ratio: (now - start) / (end - start), start };
    }
  }
  return found && { id: found.id, ratio: found.ratio };
}

export interface SlotGridInput {
  dayKey: string;
  zone: string;
  workday: WorkdayHours | null | undefined;
  /** Grid step, minutes (`master_settings.calendar_slot_step_minutes`). */
  stepMinutes: number;
  /** Length of the visit being placed, minutes. */
  duration: number;
  /** Taken time: other visits, personal time. Schedule breaks are added here. */
  busy: readonly TimeInterval[];
  /** Starts before this instant are not offered. */
  now: number;
}

export type DayPart = 'morning' | 'afternoon' | 'evening';

/** "Утро" before 12:00, "День" before 17:00, then "Вечер" — by the local hour. */
export function dayPart(utcIso: string, zone: string): DayPart {
  const hour = DateTime.fromISO(utcIso, { zone: 'utc' }).setZone(zone).hour;
  if (hour < 12) return 'morning';
  return hour < 17 ? 'afternoon' : 'evening';
}

/** A start on the day's grid: open, taken, or open but too short for the visit. */
export type SlotState = 'free' | 'busy' | 'short';

export interface GridSlot {
  /** UTC ISO */
  start: string;
  state: SlotState;
}

/**
 * Every start on the working grid of a day with its state (design "Запись · 3 из 4"):
 * `busy` when the step itself is taken (a visit, personal time, a break), `short` when
 * it is open but the visit doesn't fit before the next taken time or the end of the
 * day, `free` otherwise. Starts before `now` are left out. Empty on a day off.
 */
export function daySlotGrid({
  dayKey,
  zone,
  workday,
  stepMinutes,
  duration,
  busy,
  now,
}: SlotGridInput): GridSlot[] {
  const hours = workingHours(dayKey, zone, workday);
  if (!hours || stepMinutes <= 0) return [];
  const open = ms(hours.start);
  const end = ms(hours.end);
  const reach = Math.max(duration, 1) * 60_000;
  // Taken time as numbers, only what can touch the day: callers pass months of it.
  const taken: [number, number][] = [];
  const take = (from: number, to: number) => {
    if (from < end + reach && to > open) taken.push([from, to]);
  };
  for (const b of busy) take(ms(b.start), ms(b.end));
  for (const b of workday?.breaks ?? []) {
    take(ms(wallTimeUtc(dayKey, b.start, zone)), ms(wallTimeUtc(dayKey, b.end, zone)));
  }
  const hits = (from: number, to: number) => taken.some(([s, e]) => from < e && to > s);

  const step = stepMinutes * 60_000;
  const slots: GridSlot[] = [];
  for (let start = open; start < end; start += step) {
    if (start < now) continue;
    const state: SlotState = hits(start, start + step)
      ? 'busy'
      : start + reach > end || hits(start, start + duration * 60_000)
        ? 'short'
        : 'free';
    slots.push({ start: new Date(start).toISOString(), state });
  }
  return slots;
}

/** How full a day is, for the dot under it: none on a day off. */
export type DayLoad = 'off' | 'open' | 'tight' | 'full';

/** Up to this share of the grid still free reads as "почти занято". */
const TIGHT_SHARE = 0.3;

/** The dot of a day from its grid (`daySlotGrid` with `now` = 0, the whole day). */
export function dayLoad(working: boolean, grid: readonly GridSlot[]): DayLoad {
  if (!working) return 'off';
  const free = grid.filter((slot) => slot.state === 'free').length;
  if (free === 0) return 'full';
  return free / grid.length <= TIGHT_SHARE ? 'tight' : 'open';
}

/** The first record that the visit [start, start + duration) would overlap. */
export function firstOverlap<R extends TimedRecord>(
  startIso: string,
  duration: number,
  records: readonly R[],
): R | null {
  const start = ms(startIso);
  const end = start + duration * 60_000;
  return (
    [...records]
      .sort((a, b) => ms(a.start_at) - ms(b.start_at))
      .find((r) => start < ms(r.start_at) + r.duration * 60_000 && end > ms(r.start_at)) ?? null
  );
}
