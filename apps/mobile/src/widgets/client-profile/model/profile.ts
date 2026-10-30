/**
 * The client profile's numbers (design "Клиент"): visits, rhythm, no-shows, average
 * check and total, when to invite again, and the visit list grouped by day. Pure,
 * `now`-injected; amounts are what was paid at checkout, else the booked price.
 */
import { DateTime } from 'luxon';
import type { ClientAppointment } from '@/entities/appointment';
import { recallState } from '@/entities/client';

const DAY_MS = 86_400_000;

export interface ProfileStats {
  visits: number;
  noShows: number;
  /** Median days between visits; null with fewer than three. */
  cadenceDays: number | null;
  averageCheck: number;
  total: number;
  /** When to invite again (last visit + rhythm); null when booked ahead or unknown. */
  recallAt: string | null;
  firstVisit: string | null;
}

/** What a visit cost: the checkout amount, else the booked price. */
export function visitAmount(appointment: ClientAppointment, listPrice: number): number {
  return appointment.paid ?? appointment.price ?? listPrice;
}

export function profileStats(
  appointments: readonly ClientAppointment[],
  priceOf: (appointment: ClientAppointment) => number,
  now: number,
): ProfileStats {
  const done = appointments.filter((a) => a.status === 'completed');
  const starts = done.map((a) => a.start_at).sort();
  const upcoming = appointments.some(
    (a) => (a.status === 'pending' || a.status === 'confirmed') && Date.parse(a.start_at) > now,
  );
  const rhythm = recallState(starts, upcoming, now);
  const total = done.reduce((sum, a) => sum + priceOf(a), 0);
  const last = starts.at(-1);
  return {
    visits: done.length,
    noShows: appointments.filter((a) => a.status === 'no_show').length,
    cadenceDays: rhythm?.cadenceDays ?? null,
    averageCheck: done.length ? Math.round(total / done.length) : 0,
    total,
    recallAt:
      rhythm && !upcoming && last
        ? new Date(Date.parse(last) + rhythm.cadenceDays * DAY_MS).toISOString()
        : null,
    firstVisit: starts[0] ?? null,
  };
}

/** "Клиент с марта 2025": the earlier of the card and the first visit. */
export function clientSince(createdAt: string, firstVisit: string | null): string {
  return firstVisit && firstVisit < createdAt ? firstVisit : createdAt;
}

export interface VisitDay {
  /** 'yyyy-MM-dd' in the master's zone. */
  dayKey: string;
  isToday: boolean;
  visits: ClientAppointment[];
}

/** Visits by calendar day in the master's zone, newest day first. */
export function groupVisitsByDay(
  appointments: readonly ClientAppointment[],
  zone: string,
  now: number,
): VisitDay[] {
  const todayKey = DateTime.fromMillis(now, { zone }).toISODate();
  const days = new Map<string, ClientAppointment[]>();
  const sorted = [...appointments].sort((a, b) => b.start_at.localeCompare(a.start_at));
  for (const appointment of sorted) {
    const key = DateTime.fromISO(appointment.start_at, { zone: 'utc' }).setZone(zone).toISODate()!;
    days.set(key, [...(days.get(key) ?? []), appointment]);
  }
  return [...days].map(([dayKey, visits]) => ({
    dayKey,
    isToday: dayKey === todayKey,
    // Within a day, in time order.
    visits: visits.reverse(),
  }));
}
