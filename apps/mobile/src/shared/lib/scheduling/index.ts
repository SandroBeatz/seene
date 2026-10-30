/**
 * Pure availability/scheduling math — the app's core (RS-1/RS-2).
 *
 * Built: the day bounds and the day timeline the "Сегодня" schedule and the calendar
 * day view render (appointments, schedule breaks, personal time, the "now" line).
 * Also the free start times of a day (rescheduling, and later the quick-create wizard)
 * grouped into morning / afternoon / evening.
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
  | ({ kind: 'break' } & TimeInterval)
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

/** Same-start order: all-day personal time, then breaks, then personal time, then visits. */
const KIND_ORDER = { block: 1, break: 2, appointment: 3 } as const;

export interface BuildDayTimelineInput<A extends TimedRecord, B extends BlockRecord> {
  dayKey: string;
  zone: string;
  workday: WorkdayHours | null | undefined;
  /** Already filtered to what the schedule shows. */
  appointments: readonly A[];
  blocks: readonly B[];
  now: number;
}

/**
 * The day as one ordered list. Appointments and personal time that overlap the day
 * are kept (a block spilling over midnight is clipped to the day); schedule breaks
 * come from the working day. The "now" line is added on the current day only, before
 * the first item that starts after now — so it sits under an ongoing visit.
 */
export function buildDayTimeline<A extends TimedRecord, B extends BlockRecord>({
  dayKey,
  zone,
  workday,
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

  if (workday?.enabled) {
    for (const range of workday.breaks) {
      items.push({
        kind: 'break',
        start: wallTimeUtc(dayKey, range.start, zone),
        end: wallTimeUtc(dayKey, range.end, zone),
      });
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

export interface FreeSlotsInput {
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

const overlaps = (aStart: number, aEnd: number, b: TimeInterval) =>
  aStart < ms(b.end) && aEnd > ms(b.start);

/**
 * Start times (UTC ISO) on the working grid where a visit of `duration` fits inside
 * the working hours without touching busy time or a break. Empty on a day off.
 */
export function findFreeSlots({
  dayKey,
  zone,
  workday,
  stepMinutes,
  duration,
  busy,
  now,
}: FreeSlotsInput): string[] {
  const hours = workingHours(dayKey, zone, workday);
  if (!hours || stepMinutes <= 0 || duration <= 0) return [];
  const taken: TimeInterval[] = [
    ...busy,
    ...(workday?.breaks ?? []).map((b) => ({
      start: wallTimeUtc(dayKey, b.start, zone),
      end: wallTimeUtc(dayKey, b.end, zone),
    })),
  ];
  const slots: string[] = [];
  const end = ms(hours.end);
  for (
    let start = ms(hours.start);
    start + duration * 60_000 <= end;
    start += stepMinutes * 60_000
  ) {
    const finish = start + duration * 60_000;
    if (start < now || taken.some((b) => overlaps(start, finish, b))) continue;
    slots.push(new Date(start).toISOString());
  }
  return slots;
}

export type DayPart = 'morning' | 'afternoon' | 'evening';

/** "Утро" before 12:00, "День" before 17:00, then "Вечер" — by the local hour. */
export function dayPart(utcIso: string, zone: string): DayPart {
  const hour = DateTime.fromISO(utcIso, { zone: 'utc' }).setZone(zone).hour;
  if (hour < 12) return 'morning';
  return hour < 17 ? 'afternoon' : 'evening';
}

/** Slots grouped by part of day, empty groups dropped, in day order. */
export function groupByDayPart(
  slots: readonly string[],
  zone: string,
): { part: DayPart; slots: string[] }[] {
  const order: DayPart[] = ['morning', 'afternoon', 'evening'];
  return order
    .map((part) => ({ part, slots: slots.filter((s) => dayPart(s, zone) === part) }))
    .filter((group) => group.slots.length > 0);
}
