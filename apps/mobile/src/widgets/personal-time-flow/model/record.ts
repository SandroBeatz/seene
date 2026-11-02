/** Between a "Личное время" draft and its `time_block` row. Pure. */
import { DateTime } from 'luxon';
import type { CreateTimeBlockDto, TimeBlock } from '@/entities/time-block';
import { dayBounds } from '@/shared/lib/scheduling';
import { DEFAULT_LENGTH, type PersonalTimeDraft } from './draft.store';

/**
 * The whole day is the bounds of its days in the master's zone (DST-safe); otherwise the
 * start plus the length. The name is trimmed, empty = none. Null until a start is
 * chosen for a part of the day.
 */
export function personalTimeRecord(
  draft: Pick<PersonalTimeDraft, 'start' | 'allDay' | 'length' | 'spanDays' | 'title'>,
  dayKey: string,
  zone: string,
): CreateTimeBlockDto | null {
  const notes = draft.title.trim() || null;
  if (draft.allDay) {
    const lastDay = DateTime.fromISO(dayKey, { zone }).plus({ days: draft.spanDays - 1 });
    return {
      start_at: dayBounds(dayKey, zone).start,
      end_at: dayBounds(lastDay.toISODate()!, zone).end,
      all_day: true,
      notes,
    };
  }
  if (!draft.start) return null;
  const end = new Date(new Date(draft.start).getTime() + draft.length * 60_000);
  return { start_at: draft.start, end_at: end.toISOString(), all_day: false, notes };
}

/** How long the block is, minutes. */
export function blockMinutes(block: Pick<TimeBlock, 'start_at' | 'end_at'>): number {
  return (new Date(block.end_at).getTime() - new Date(block.start_at).getTime()) / 60_000;
}

/** The block in draft terms, for moving it. An all-day block has no length of its own. */
export function draftOfBlock(block: TimeBlock, zone: string) {
  const local = (iso: string) => DateTime.fromISO(iso, { zone: 'utc' }).setZone(zone);
  const first = local(block.start_at);
  // The end is exclusive: midnight belongs to the next day.
  const last = local(new Date(new Date(block.end_at).getTime() - 1).toISOString());
  return {
    dayKey: first.toISODate()!,
    allDay: block.all_day,
    length: block.all_day ? DEFAULT_LENGTH : blockMinutes(block),
    spanDays: block.all_day
      ? Math.round(last.startOf('day').diff(first.startOf('day'), 'days').days) + 1
      : 1,
    title: block.notes ?? '',
  };
}

/** Saving this record would leave the block where it is. */
export function staysInPlace(block: TimeBlock, record: CreateTimeBlockDto): boolean {
  const same = (a: string, b: string) => new Date(a).getTime() === new Date(b).getTime();
  return (
    block.all_day === record.all_day &&
    same(block.start_at, record.start_at) &&
    same(block.end_at, record.end_at)
  );
}
