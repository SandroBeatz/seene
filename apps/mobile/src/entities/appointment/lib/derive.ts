/**
 * Pure appointment derivations (domain-model.md §3). All time math is UTC-epoch based
 * and takes `now` for deterministic tests. No entity imports — service totals accept a
 * minimal `{ duration, price }` shape so this stays free of the service entity.
 */
import type { Appointment, EffectiveAppointmentStatus } from '../model/types';

type TimedAppointment = Pick<Appointment, 'start_at' | 'duration' | 'status'>;

/** Epoch ms of the appointment's end (start + duration). */
export function appointmentEndMs(a: Pick<Appointment, 'start_at' | 'duration'>): number {
  return new Date(a.start_at).getTime() + a.duration * 60_000;
}

/**
 * UI status: a confirmed appointment becomes `ongoing` while now is inside its window
 * and `past` once it has ended without being completed. Every other stored status is
 * returned unchanged.
 */
export function getEffectiveAppointmentStatus(
  a: TimedAppointment,
  now: number = Date.now(),
): EffectiveAppointmentStatus {
  if (a.status === 'confirmed') {
    const start = new Date(a.start_at).getTime();
    if (now >= start && now < appointmentEndMs(a)) return 'ongoing';
    if (now >= appointmentEndMs(a)) return 'past';
  }
  return a.status;
}

/** Needs the master's attention: pending, or confirmed and already started. */
export function isActionable(a: TimedAppointment, now: number = Date.now()): boolean {
  if (a.status === 'pending') return true;
  return a.status === 'confirmed' && new Date(a.start_at).getTime() < now;
}

/**
 * The client's last visit date (ISO `start_at`) — the most recent completed/confirmed
 * appointment whose end has passed, or null if none.
 */
export function lastVisitDate(appointments: TimedAppointment[], now: number = Date.now()): string | null {
  let latest: TimedAppointment | null = null;
  for (const a of appointments) {
    const visited = a.status === 'completed' || a.status === 'confirmed';
    if (!visited || appointmentEndMs(a) > now) continue;
    if (!latest || appointmentEndMs(a) > appointmentEndMs(latest)) latest = a;
  }
  return latest ? latest.start_at : null;
}

/** Σ duration of the selected services (minutes). */
export function sumServiceDuration(services: { duration: number }[]): number {
  return services.reduce((total, s) => total + s.duration, 0);
}

/** Σ price of the selected services. */
export function sumServicePrice(services: { price: number }[]): number {
  return services.reduce((total, s) => total + s.price, 0);
}

/** Effective price: the explicit override when set, otherwise the sum of services. */
export function appointmentTotalPrice(
  a: Pick<Appointment, 'price'>,
  services: { price: number }[],
): number {
  return a.price ?? sumServicePrice(services);
}
