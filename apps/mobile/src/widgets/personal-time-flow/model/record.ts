/** The `time_block` row a "Личное время" draft saves. Pure. */
import type { CreateTimeBlockDto } from '@/entities/time-block';
import { dayBounds } from '@/shared/lib/scheduling';
import type { PersonalTimeDraft } from './draft.store';

/**
 * The whole day is the day's bounds in the master's zone (DST-safe); otherwise the
 * start plus the length. The name is trimmed, empty = none. Null until a start is
 * chosen for a part of the day.
 */
export function personalTimeRecord(
  draft: Pick<PersonalTimeDraft, 'start' | 'allDay' | 'length' | 'title'>,
  dayKey: string,
  zone: string,
): CreateTimeBlockDto | null {
  const notes = draft.title.trim() || null;
  if (draft.allDay) {
    const bounds = dayBounds(dayKey, zone);
    return { start_at: bounds.start, end_at: bounds.end, all_day: true, notes };
  }
  if (!draft.start) return null;
  const end = new Date(new Date(draft.start).getTime() + draft.length * 60_000);
  return { start_at: draft.start, end_at: end.toISOString(), all_day: false, notes };
}
