/**
 * Everything "Сегодня" renders, composed from the entity queries: the master's day in
 * their own zone (from the stored schedule), its timeline, the summary and the first
 * steps. Re-derives every minute so the "now" line, past dimming and the day itself
 * roll over without a refetch.
 */
import { useEffect, useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import {
  appointmentColor,
  appointmentTotalPrice,
  isShownInSchedule,
  useAppointmentsRangeQuery,
  type Appointment,
} from '@/entities/appointment';
import { useClientsQuery, type Client } from '@/entities/client';
import {
  parseStoredSchedule,
  scheduleForWeekday,
  useMasterProfileQuery,
  useMasterSettingsQuery,
} from '@/entities/master';
import { useSaleAmountsRangeQuery } from '@/entities/sale';
import { useServicesQuery, type ServiceWithCategory } from '@/entities/service';
import { useUserId } from '@/entities/session';
import { useTimeBlocksRangeQuery, type TimeBlock } from '@/entities/time-block';
import { DEFAULT_SERVICE_COLOR } from '@/shared/config/palettes';
import { buildDayTimeline, dayBounds, weekdayIndex, workingHours } from '@/shared/lib/scheduling';
import { deviceTimeZone } from '@/shared/lib/time-zone';
import { firstSteps } from './first-steps';
import { summarizeDay } from './summary';

/** Current time, refreshed at the start of every minute. */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(
      () => {
        setNow(Date.now());
        interval = setInterval(() => setNow(Date.now()), 60_000);
      },
      60_000 - (Date.now() % 60_000),
    );
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);
  return now;
}

/** An appointment as the schedule draws it. */
export interface ScheduleVisit {
  appointment: Appointment;
  client: Client | undefined;
  /** Service names, in the appointment's order. */
  serviceNames: string[];
  price: number;
  color: string;
}

export function useToday() {
  const userId = useUserId() ?? '';
  const now = useNow();

  const profile = useMasterProfileQuery(userId);
  const settings = useMasterSettingsQuery(userId);
  const schedule = useMemo(() => parseStoredSchedule(profile.data?.schedule), [profile.data]);
  const zone = schedule?.timezone ?? deviceTimeZone();

  const today = DateTime.fromMillis(now, { zone });
  const dayKey = today.toISODate()!;
  const bounds = useMemo(() => dayBounds(dayKey, zone), [dayKey, zone]);

  const appointments = useAppointmentsRangeQuery(userId, bounds.start, bounds.end);
  const blocks = useTimeBlocksRangeQuery(userId, bounds.start, bounds.end);
  const sales = useSaleAmountsRangeQuery(userId, bounds.start, bounds.end);
  const services = useServicesQuery(userId);
  const clients = useClientsQuery(userId);

  const queries = [profile, settings, appointments, blocks, sales, services, clients];
  const isPending = queries.some((q) => q.isPending);
  const error = queries.find((q) => q.isError)?.error ?? null;
  const isRefetching = queries.some((q) => q.isRefetching);
  const refetch = () => Promise.all(queries.map((q) => q.refetch()));

  const workday = schedule ? scheduleForWeekday(schedule, weekdayIndex(dayKey)) : null;

  const derived = useMemo(() => {
    const serviceById = new Map<string, ServiceWithCategory>(
      (services.data ?? []).map((s) => [s.id, s]),
    );
    const clientById = new Map<string, Client>((clients.data ?? []).map((c) => [c.id, c]));
    const visits = (appointments.data ?? []).filter(isShownInSchedule);

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
    const visitById = new Map(visits.map((a) => [a.id, toVisit(a)]));

    const timeline = buildDayTimeline({
      dayKey,
      zone,
      workday,
      appointments: visits,
      blocks: (blocks.data ?? []) as TimeBlock[],
      now,
    });

    const summary = summarizeDay({
      appointments: visits,
      priceOf: (a) => visitById.get(a.id)?.price ?? 0,
      paid: new Map((sales.data ?? []).map((s) => [s.appointment_id, s.amount])),
      now,
    });

    const steps = firstSteps({
      services: services.data ?? [],
      clientCount: clients.data?.length ?? 0,
      profile: profile.data ?? null,
    });

    return { timeline, summary, steps, visitById };
  }, [
    appointments.data,
    blocks.data,
    sales.data,
    services.data,
    clients.data,
    profile.data,
    dayKey,
    zone,
    workday,
    now,
  ]);

  return {
    isPending,
    error,
    isRefetching,
    refetch,
    now,
    zone,
    dayKey,
    profile: profile.data ?? null,
    currency: settings.data?.currency ?? 'EUR',
    timeFormat: (settings.data?.time_format === 12 ? 12 : 24) as 12 | 24,
    hours: workingHours(dayKey, zone, workday),
    ...derived,
  };
}

export type TodayData = ReturnType<typeof useToday>;
