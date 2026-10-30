/**
 * The dark day summary on "Сегодня": money earned against the day's plan and one
 * segment per visit (passed / now / ahead). Pure, `now`-injected.
 */
import { appointmentEndMs, isShownInSchedule, type Appointment } from '@/entities/appointment';

export type DaySegment = 'done' | 'now' | 'ahead';

export interface DaySummary {
  /** Visits the schedule shows (pending, confirmed, completed). */
  count: number;
  /** Σ paid for those visits. */
  earned: number;
  /** Σ price of those visits. */
  planned: number;
  /** 0–1, earned / planned. */
  progress: number;
  /** One per visit, in start order. */
  segments: DaySegment[];
}

type SummaryAppointment = Pick<Appointment, 'id' | 'status' | 'start_at' | 'duration'>;

export interface DaySummaryInput<A extends SummaryAppointment> {
  /** The day's appointments, any status. */
  appointments: readonly A[];
  /** The visit's price: the override, or the sum of its services. */
  priceOf: (appointment: A) => number;
  /** Paid amount per appointment id (sales). */
  paid: ReadonlyMap<string, number>;
  now: number;
}

export function summarizeDay<A extends SummaryAppointment>({
  appointments,
  priceOf,
  paid,
  now,
}: DaySummaryInput<A>): DaySummary {
  const visits = appointments
    .filter(isShownInSchedule)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  let earned = 0;
  let planned = 0;
  const segments = visits.map((visit): DaySegment => {
    earned += paid.get(visit.id) ?? 0;
    planned += priceOf(visit);
    if (visit.status === 'completed' || appointmentEndMs(visit) <= now) return 'done';
    return new Date(visit.start_at).getTime() <= now ? 'now' : 'ahead';
  });

  return {
    count: visits.length,
    earned,
    planned,
    progress: planned > 0 ? Math.min(1, earned / planned) : 0,
    segments,
  };
}
