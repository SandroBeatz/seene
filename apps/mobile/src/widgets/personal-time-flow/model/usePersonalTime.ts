/**
 * What both steps of "Личное время" read: the draft resolved in the master's zone —
 * the day, its label, the span ("13:00–14:00" or the whole day) and the record to save.
 */
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { useTimeContext } from '@/features/pick-time';
import { useNow } from '@/shared/ui';
import { usePersonalTimeDraft } from './draft.store';
import { personalTimeRecord } from './record';

export function usePersonalTime() {
  const { t } = useTranslation();
  const ctx = useTimeContext();
  const draft = usePersonalTimeDraft();
  const now = useNow();

  const todayKey = DateTime.fromMillis(now, { zone: ctx.zone }).toISODate()!;
  const dayKey = draft.dayKey ?? todayKey;

  /** The record to save; null until the step has an answer. */
  const record = personalTimeRecord(draft, dayKey, ctx.zone);

  const dayLabel = ctx.dayLabel(dayKey);
  const span = !draft.allDay && draft.start ? ctx.range(draft.start, draft.length) : null;
  const lastKey = DateTime.fromISO(dayKey, { zone: ctx.zone })
    .plus({ days: draft.spanDays - 1 })
    .toISODate()!;

  return {
    ctx,
    draft,
    dayKey,
    record,
    dayLabel,
    /** "13:00–14:00"; null for the whole day or before a start is chosen. */
    span,
    /** The bar's line: "Пн 2 ноября · 13:00–14:00", "Пн 2 ноября · весь день" or "Выберите время". */
    summary: !draft.allDay
      ? span
        ? `${dayLabel} · ${span}`
        : t('quickCreate.time.pick')
      : draft.spanDays > 1
        ? `${dayLabel} – ${ctx.dayLabel(lastKey)}`
        : `${dayLabel} · ${t('personalTime.when.allDayShort')}`,
  };
}
