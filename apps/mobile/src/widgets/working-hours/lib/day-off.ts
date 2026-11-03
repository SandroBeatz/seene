/** Between the day-off sheet and its `time_block` row. Pure; days are "yyyy-MM-dd". */
import { DateTime } from 'luxon';
import type { CreateTimeBlockDto, TimeBlock, TimeBlockKind } from '@/entities/time-block';
import { dayBounds } from '@/shared/lib/scheduling';

export type DayOffKind = Exclude<TimeBlockKind, 'personal'>;

export interface DayOffDraft {
  kind: DayOffKind;
  start: string;
  end: string;
  allDay: boolean;
  /** "HH:mm", for a part of one day. */
  fromTime: string;
  toTime: string;
  closeOnline: boolean;
  note: string;
}

export const EMPTY_DRAFT: DayOffDraft = {
  kind: 'day_off',
  start: '',
  end: '',
  allDay: true,
  fromTime: '10:00',
  toTime: '14:00',
  closeOnline: true,
  note: '',
};

/** First tap a day, a later one ends the range; a third, or an earlier day, starts over. */
export function pickRange(
  range: { start: string; end: string },
  day: string,
  allowRange: boolean,
): { start: string; end: string } {
  if (allowRange && range.start && range.start === range.end && day > range.start) {
    return { start: range.start, end: day };
  }
  return { start: day, end: day };
}

/** Null until a day is picked, or while a part of the day ends before it starts. */
export function dayOffRecord(draft: DayOffDraft, zone: string): CreateTimeBlockDto | null {
  if (!draft.start) return null;
  const common = {
    kind: draft.kind,
    close_online: draft.closeOnline,
    notes: draft.note.trim() || null,
  };
  if (draft.allDay) {
    return {
      ...common,
      start_at: dayBounds(draft.start, zone).start,
      end_at: dayBounds(draft.end, zone).end,
      all_day: true,
    };
  }
  if (draft.toTime <= draft.fromTime) return null;
  const at = (time: string) =>
    DateTime.fromISO(`${draft.start}T${time}`, { zone }).toUTC().toISO()!;
  return { ...common, start_at: at(draft.fromTime), end_at: at(draft.toTime), all_day: false };
}

const local = (iso: string, zone: string) => DateTime.fromISO(iso, { zone: 'utc' }).setZone(zone);

/** The block's first and last days. Its end is exclusive: midnight belongs to the next day. */
export function blockDays(block: Pick<TimeBlock, 'start_at' | 'end_at'>, zone: string) {
  const last = new Date(new Date(block.end_at).getTime() - 1).toISOString();
  return { first: local(block.start_at, zone).toISODate()!, last: local(last, zone).toISODate()! };
}

export function draftOfBlock(block: TimeBlock, zone: string): DayOffDraft {
  const { first, last } = blockDays(block, zone);
  return {
    kind: block.kind === 'vacation' ? 'vacation' : 'day_off',
    start: first,
    end: last,
    allDay: block.all_day,
    fromTime: block.all_day ? EMPTY_DRAFT.fromTime : local(block.start_at, zone).toFormat('HH:mm'),
    toTime: block.all_day ? EMPTY_DRAFT.toTime : local(block.end_at, zone).toFormat('HH:mm'),
    closeOnline: block.close_online,
    note: block.notes ?? '',
  };
}

/** Both ends counted. */
export function daysInRange(first: string, last: string): number {
  const days = DateTime.fromISO(last, { zone: 'utc' }).diff(
    DateTime.fromISO(first, { zone: 'utc' }),
    'days',
  ).days;
  return Math.round(days) + 1;
}

/** "1 января", "22 – 29 декабря", "28 декабря – 2 января". `months` are in the genitive. */
export function rangeLabel(first: string, last: string, months: readonly string[]): string {
  const a = DateTime.fromISO(first, { zone: 'utc' });
  const b = DateTime.fromISO(last, { zone: 'utc' });
  const monthOf = (d: DateTime) => months[d.month - 1] ?? '';
  if (first === last) return `${a.day} ${monthOf(a)}`;
  if (a.hasSame(b, 'month')) return `${a.day} – ${b.day} ${monthOf(b)}`;
  return `${a.day} ${monthOf(a)} – ${b.day} ${monthOf(b)}`;
}
