/**
 * What both steps of "Личное время" read: the draft resolved in the master's zone —
 * the day, its label, the span ("13:00–14:00" or the whole day) and the record to save.
 */
import { DateTime } from 'luxon';
import { useTimeContext } from '@/features/pick-time';
import { useNow } from '@/shared/ui';
import { usePersonalTimeDraft } from './draft.store';
import { personalTimeRecord } from './record';

export function usePersonalTime() {
  const ctx = useTimeContext();
  const draft = usePersonalTimeDraft();
  const now = useNow();

  const todayKey = DateTime.fromMillis(now, { zone: ctx.zone }).toISODate()!;
  const dayKey = draft.dayKey ?? todayKey;

  /** The record to save; null until the step has an answer. */
  const record = personalTimeRecord(draft, dayKey, ctx.zone);

  return {
    ctx,
    draft,
    dayKey,
    ready: record !== null,
    record,
    dayLabel: ctx.dayLabel(dayKey),
    /** "13:00–14:00"; null for the whole day or before a start is chosen. */
    span: !draft.allDay && draft.start ? ctx.range(draft.start, draft.length) : null,
  };
}
