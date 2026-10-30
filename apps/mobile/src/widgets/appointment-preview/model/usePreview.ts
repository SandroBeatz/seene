/**
 * The data the appointment preview renders: the appointment, its client and
 * services, the client's visit count and the master's zone/currency/clock.
 */
import { useMemo } from 'react';
import { DateTime } from 'luxon';
import {
  appointmentEndMs,
  getAppointmentPhase,
  sumServiceDuration,
  sumServicePrice,
  useAppointmentQuery,
  useClientVisitCountQuery,
} from '@/entities/appointment';
import { useClientQuery } from '@/entities/client';
import {
  parseStoredSchedule,
  useMasterProfileQuery,
  useMasterSettingsQuery,
} from '@/entities/master';
import { useServicesQuery } from '@/entities/service';
import { useUserId } from '@/entities/session';
import { deviceTimeZone } from '@/shared/lib/time-zone';
import { useNow } from '@/shared/ui';

export function usePreview(appointmentId: string) {
  const userId = useUserId() ?? '';
  const now = useNow();

  const appointment = useAppointmentQuery(appointmentId);
  const client = useClientQuery(appointment.data?.client_id);
  const services = useServicesQuery(userId);
  const visits = useClientVisitCountQuery(userId, appointment.data?.client_id);
  const profile = useMasterProfileQuery(userId);
  const settings = useMasterSettingsQuery(userId);

  const zone = parseStoredSchedule(profile.data?.schedule)?.timezone ?? deviceTimeZone();

  const derived = useMemo(() => {
    const a = appointment.data;
    if (!a) return null;
    const byId = new Map((services.data ?? []).map((s) => [s.id, s]));
    const its = a.service_ids.flatMap((id) => byId.get(id) ?? []);
    const listPrice = sumServicePrice(its);
    return {
      appointment: a,
      phase: getAppointmentPhase(a, now),
      serviceNames: its.map((s) => s.name),
      /** Σ of the services as in the price list. */
      listPrice,
      listDuration: sumServiceDuration(its),
      /** What the visit costs: the override, else the list price. */
      price: a.price ?? listPrice,
      ownPrice: a.price !== null && a.price !== listPrice,
      endAt: new Date(appointmentEndMs(a)).toISOString(),
      dayKey: DateTime.fromISO(a.start_at, { zone: 'utc' }).setZone(zone).toISODate()!,
      todayKey: DateTime.fromMillis(now, { zone }).toISODate()!,
    };
  }, [appointment.data, services.data, now, zone]);

  return {
    isPending: appointment.isPending,
    error: appointment.error ?? null,
    /** Deleted or not the master's. */
    isMissing: appointment.isSuccess && !appointment.data,
    refetch: () => void appointment.refetch(),
    now,
    zone,
    currency: settings.data?.currency ?? 'EUR',
    timeFormat: (settings.data?.time_format === 12 ? 12 : 24) as 12 | 24,
    client: client.data ?? null,
    visitCount: visits.data ?? null,
    data: derived,
  };
}

export type PreviewData = NonNullable<ReturnType<typeof usePreview>['data']>;
