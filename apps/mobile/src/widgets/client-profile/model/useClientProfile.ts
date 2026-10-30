/**
 * Everything the client profile shows: the card, their appointments with service
 * names and colours, the numbers, and the master's zone, currency and clock.
 */
import { useMemo } from 'react';
import {
  appointmentColor,
  sumServicePrice,
  useClientAppointmentsQuery,
  type ClientAppointment,
} from '@/entities/appointment';
import { useClientQuery } from '@/entities/client';
import { parseStoredSchedule, useMasterProfileQuery, useMasterSettingsQuery } from '@/entities/master';
import { useServicesQuery, type ServiceWithCategory } from '@/entities/service';
import { useUserId } from '@/entities/session';
import { DEFAULT_SERVICE_COLOR } from '@/shared/config/palettes';
import { deviceTimeZone } from '@/shared/lib/time-zone';
import { useNow } from '@/shared/ui';
import { groupVisitsByDay, profileStats, visitAmount } from './profile';

export interface ProfileVisit {
  appointment: ClientAppointment;
  serviceNames: string[];
  color: string;
  amount: number;
}

export function useClientProfile(clientId: string | undefined) {
  const userId = useUserId() ?? '';
  const now = useNow();
  const client = useClientQuery(clientId);
  const appointments = useClientAppointmentsQuery(userId, clientId);
  const services = useServicesQuery(userId);
  const profile = useMasterProfileQuery(userId);
  const settings = useMasterSettingsQuery(userId);
  const zone = parseStoredSchedule(profile.data?.schedule)?.timezone ?? deviceTimeZone();

  const queries = [client, appointments, services, profile, settings];
  const isPending = client.isPending || appointments.isPending || services.isPending;
  const error = queries.find((q) => q.isError)?.error ?? null;
  const isRefetching = queries.some((q) => q.isRefetching);
  const refetch = () => Promise.all(queries.map((q) => q.refetch()));

  const derived = useMemo(() => {
    const byId = new Map<string, ServiceWithCategory>((services.data ?? []).map((s) => [s.id, s]));
    const servicesOf = (a: ClientAppointment) =>
      a.service_ids.map((id) => byId.get(id)).filter((s): s is ServiceWithCategory => !!s);
    const priceOf = (a: ClientAppointment) => visitAmount(a, sumServicePrice(servicesOf(a)));
    const list = appointments.data ?? [];
    const visitOf = (a: ClientAppointment): ProfileVisit => ({
      appointment: a,
      serviceNames: servicesOf(a).map((s) => s.name),
      color: appointmentColor(a.service_ids, byId, DEFAULT_SERVICE_COLOR),
      amount: priceOf(a),
    });
    return {
      stats: profileStats(list, priceOf, now),
      days: groupVisitsByDay(list, zone, now).map((day) => ({
        ...day,
        items: day.visits.map(visitOf),
      })),
      count: list.length,
    };
  }, [appointments.data, services.data, zone, now]);

  return {
    client: client.data ?? null,
    ...derived,
    isPending,
    error,
    isRefetching,
    refetch,
    now,
    zone,
    currency: settings.data?.currency ?? 'EUR',
    timeFormat: (settings.data?.time_format === 12 ? 12 : 24) as 12 | 24,
  };
}
