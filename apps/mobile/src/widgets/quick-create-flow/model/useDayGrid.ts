/**
 * The days of "Дата и время": how full each day is (the dot under it) and the grid of
 * the chosen day — every start with its state for a visit of the chosen length.
 * Taken time = visits shown in the schedule, personal time and the schedule's breaks,
 * in the master's zone.
 */
import { useCallback, useMemo } from 'react';
import { DateTime } from 'luxon';
import {
  appointmentEndMs,
  isShownInSchedule,
  useAppointmentsRangeQuery,
  type Appointment,
} from '@/entities/appointment';
import { scheduleForWeekday, type StoredSchedule } from '@/entities/master';
import { useTimeBlocksRangeQuery, type TimeBlock } from '@/entities/time-block';
import {
  dayBounds,
  dayLoad,
  daySlotGrid,
  weekdayIndex,
  type DayLoad,
  type GridSlot,
  type TimeInterval,
} from '@/shared/lib/scheduling';

export interface DayGridInput {
  userId: string;
  zone: string;
  schedule: StoredSchedule | null;
  stepMinutes: number;
  duration: number;
  now: number;
  /** First and last day to load, "yyyy-MM-dd". */
  fromKey: string;
  toKey: string;
}

export function useDayGrid({
  userId,
  zone,
  schedule,
  stepMinutes,
  duration,
  now,
  fromKey,
  toKey,
}: DayGridInput) {
  const from = dayBounds(fromKey, zone).start;
  const to = dayBounds(toKey, zone).end;
  const visits = useAppointmentsRangeQuery(userId, from, to);
  const blocks = useTimeBlocksRangeQuery(userId, from, to);

  const shown = useMemo(() => (visits.data ?? []).filter(isShownInSchedule), [visits.data]);
  const busy = useMemo<TimeInterval[]>(
    () => [
      ...shown.map((a) => ({
        start: a.start_at,
        end: new Date(appointmentEndMs(a)).toISOString(),
      })),
      ...(blocks.data ?? []).map((b) => ({ start: b.start_at, end: b.end_at })),
    ],
    [shown, blocks.data],
  );

  const workdayOf = useCallback(
    (dayKey: string) => (schedule ? scheduleForWeekday(schedule, weekdayIndex(dayKey)) : null),
    [schedule],
  );

  const gridOf = useCallback(
    (dayKey: string): GridSlot[] =>
      daySlotGrid({ dayKey, zone, workday: workdayOf(dayKey), stepMinutes, duration, busy, now }),
    [zone, workdayOf, stepMinutes, duration, busy, now],
  );

  const loads = useMemo(() => {
    const map = new Map<string, DayLoad>();
    if (!visits.data || !blocks.data) return map;
    let day = DateTime.fromISO(fromKey, { zone });
    const last = DateTime.fromISO(toKey, { zone });
    while (day <= last) {
      const key = day.toISODate()!;
      map.set(key, dayLoad(!!workdayOf(key)?.enabled, gridOf(key)));
      day = day.plus({ days: 1 });
    }
    return map;
  }, [visits.data, blocks.data, fromKey, toKey, zone, workdayOf, gridOf]);

  /** Visits and personal time on a day, for the "пересекается" check. */
  const dayRecords = useCallback(
    (dayKey: string): { visits: Appointment[]; blocks: TimeBlock[] } => {
      const bounds = dayBounds(dayKey, zone);
      const inDay = (start: string, end: string) =>
        new Date(start) < new Date(bounds.end) && new Date(end) > new Date(bounds.start);
      return {
        visits: shown.filter((a) => inDay(a.start_at, new Date(appointmentEndMs(a)).toISOString())),
        blocks: (blocks.data ?? []).filter((b) => inDay(b.start_at, b.end_at)),
      };
    },
    [shown, blocks.data, zone],
  );

  return {
    isPending: visits.isPending || blocks.isPending,
    loads,
    workdayOf,
    gridOf,
    dayRecords,
  };
}
