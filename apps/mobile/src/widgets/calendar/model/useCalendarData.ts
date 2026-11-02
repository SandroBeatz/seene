/**
 * What both calendar screens read: the master's clock and schedule, and the visits and
 * personal time of the months in view, grouped by the master's local day. Months load
 * one by one and stay cached, so writes elsewhere invalidate them like any other range.
 */
import { useMemo } from 'react';
import { DateTime } from 'luxon';
import {
  appointmentColor,
  appointmentTotalPrice,
  isShownInSchedule,
  useAppointmentsRangesQuery,
  type Appointment,
} from '@/entities/appointment';
import { useClientsQuery } from '@/entities/client';
import {
  parseStoredSchedule,
  scheduleForWeekday,
  useMasterProfileQuery,
  useMasterSettingsQuery,
} from '@/entities/master';
import { useServicesQuery } from '@/entities/service';
import { useUserId } from '@/entities/session';
import { useTimeBlocksRangesQuery, type TimeBlock } from '@/entities/time-block';
import type { ScheduleVisit } from '@/features/appointment-actions';
import { DEFAULT_SERVICE_COLOR } from '@/shared/config/palettes';
import { weekdayIndex } from '@/shared/lib/scheduling';
import { deviceTimeZone } from '@/shared/lib/time-zone';
import { useNow } from '@/shared/ui';
import { groupByDay, monthBounds, type DayEntry, type DayIndex } from './calendar';

export type CalendarEntry = DayEntry<ScheduleVisit, TimeBlock>;
export type CalendarIndex = DayIndex<ScheduleVisit, TimeBlock>;

export function useCalendarClock() {
  const userId = useUserId() ?? '';
  const now = useNow();
  const profile = useMasterProfileQuery(userId);
  const settings = useMasterSettingsQuery(userId);
  const schedule = useMemo(() => parseStoredSchedule(profile.data?.schedule), [profile.data]);
  const zone = schedule?.timezone ?? deviceTimeZone();
  const local = DateTime.fromMillis(now, { zone });

  return {
    userId,
    now,
    zone,
    schedule,
    todayKey: local.toISODate()!,
    /** Minutes since the master's midnight. */
    nowMinutes: local.hour * 60 + local.minute,
    currency: settings.data?.currency ?? 'EUR',
    timeFormat: (settings.data?.time_format === 12 ? 12 : 24) as 12 | 24,
  };
}

export type CalendarClock = ReturnType<typeof useCalendarClock>;

/** The working day of a day key under the stored schedule. */
export const workdayOf = (schedule: CalendarClock['schedule'], dayKey: string) =>
  schedule ? scheduleForWeekday(schedule, weekdayIndex(dayKey)) : null;

export function useCalendarEntries(userId: string, zone: string, months: readonly string[]) {
  const monthsKey = months.join();
  const ranges = useMemo(
    () => monthsKey.split(',').map((month) => monthBounds(month, zone)),
    [monthsKey, zone],
  );
  const appointments = useAppointmentsRangesQuery(userId, ranges);
  const blocks = useTimeBlocksRangesQuery(userId, ranges);
  const services = useServicesQuery(userId);
  const clients = useClientsQuery(userId);

  const index = useMemo<CalendarIndex>(() => {
    const serviceById = new Map((services.data ?? []).map((s) => [s.id, s]));
    const clientById = new Map((clients.data ?? []).map((c) => [c.id, c]));
    const toVisit = (appointment: Appointment): ScheduleVisit => {
      const its = appointment.service_ids.flatMap((id) => serviceById.get(id) ?? []);
      return {
        appointment,
        client: clientById.get(appointment.client_id),
        serviceNames: its.map((s) => s.name),
        price: appointmentTotalPrice(appointment, its),
        color: appointmentColor(appointment.service_ids, serviceById, DEFAULT_SERVICE_COLOR),
      };
    };
    return groupByDay<ScheduleVisit, TimeBlock>({
      zone,
      visits: appointments.data
        .filter(isShownInSchedule)
        .map((a) => ({ value: toVisit(a), id: a.id, start_at: a.start_at, duration: a.duration })),
      blocks: blocks.data.map((b) => ({
        value: b,
        id: b.id,
        start_at: b.start_at,
        end_at: b.end_at,
        all_day: b.all_day,
      })),
    });
  }, [appointments.data, blocks.data, services.data, clients.data, zone]);

  const error = appointments.error ?? blocks.error ?? services.error ?? clients.error ?? null;
  const refetch = () =>
    Promise.all([appointments.refetch(), blocks.refetch(), services.refetch(), clients.refetch()]);

  const isPending =
    appointments.isPending || blocks.isPending || services.isPending || clients.isPending;

  return { index, isPending, error, refetch };
}
