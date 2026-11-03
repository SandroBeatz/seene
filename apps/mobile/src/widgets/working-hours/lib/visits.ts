/** Which visits a day off runs into. Pure. */
import type { Appointment } from '@/entities/appointment';

/** Still ahead and still on: a past or cancelled visit has nobody to warn. */
export function isAffectedVisit(
  visit: Pick<Appointment, 'status' | 'start_at'>,
  now: Date,
): boolean {
  return (
    (visit.status === 'pending' || visit.status === 'confirmed') &&
    new Date(visit.start_at).getTime() >= now.getTime()
  );
}
