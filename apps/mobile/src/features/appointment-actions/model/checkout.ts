/**
 * The "Завершить" sheet (design "Запись · «Завершить»"): the amount to take, the
 * payment method, and the visit's actual time — the planned one unless the master
 * closes it out right at the chair, when it ends now. Pure, `now`-injected.
 */
import { DateTime } from 'luxon';
import { VISIT_MAX_MINUTES, VISIT_MIN_MINUTES } from './services';

/** Closing out up to this long after the planned end still counts as "at the chair". */
export const AT_CHAIR_GRACE_MINUTES = 60;

const MINUTE = 60_000;
const STEP = 5 * MINUTE;

export interface VisitWindow {
  /** UTC ISO. */
  start_at: string;
  /** Minutes. */
  duration: number;
}

/**
 * What the time row starts with. Between the start and `AT_CHAIR_GRACE_MINUTES` past
 * the planned end the visit ends now (rounded to 5 min); otherwise — closing out a
 * past day, or ahead of time — as planned.
 */
export function defaultVisitWindow(
  appointment: Pick<VisitWindow, 'start_at' | 'duration'>,
  now: number,
): VisitWindow {
  const start = Date.parse(appointment.start_at);
  const plannedEnd = start + appointment.duration * MINUTE;
  if (now <= start || now > plannedEnd + AT_CHAIR_GRACE_MINUTES * MINUTE) {
    return { start_at: appointment.start_at, duration: appointment.duration };
  }
  const end = Math.round(now / STEP) * STEP;
  const duration = Math.max(VISIT_MIN_MINUTES, Math.round((end - start) / MINUTE));
  return { start_at: appointment.start_at, duration };
}

/** Wall-clock "HH:mm" of an instant in the master's zone. */
export function clockOf(iso: string, zone: string): string {
  return DateTime.fromISO(iso, { zone: 'utc' }).setZone(zone).toFormat('HH:mm');
}

/**
 * A window from start and end clocks on the visit's day (in `zone`); an end at or
 * before the start runs past midnight. Null when the length is out of bounds.
 */
export function windowFromClocks(
  dayIso: string,
  zone: string,
  startClock: string,
  endClock: string,
): VisitWindow | null {
  const day = DateTime.fromISO(dayIso, { zone: 'utc' }).setZone(zone);
  const at = (clock: string) => {
    const [hour, minute] = clock.split(':').map(Number);
    return day.set({ hour, minute, second: 0, millisecond: 0 });
  };
  const start = at(startClock);
  let end = at(endClock);
  if (end <= start) end = end.plus({ days: 1 });
  const duration = Math.round(end.diff(start, 'minutes').minutes);
  if (duration < VISIT_MIN_MINUTES || duration > VISIT_MAX_MINUTES) return null;
  return { start_at: start.toUTC().toISO()!, duration };
}

/** Params for the RPC: only what differs from the plan (null = keep). */
export function visitChanges(
  planned: Pick<VisitWindow, 'start_at' | 'duration'>,
  actual: VisitWindow,
): { start_at: string | null; duration: number | null } {
  return {
    start_at: Date.parse(actual.start_at) === Date.parse(planned.start_at) ? null : actual.start_at,
    duration: actual.duration === planned.duration ? null : actual.duration,
  };
}

interface Method {
  id: string;
  is_active: boolean;
  is_default: boolean;
}

/** The preselected method: the default if active, else the first active one. */
export function defaultMethodId(methods: readonly Method[]): string | null {
  const active = methods.filter((m) => m.is_active);
  return (active.find((m) => m.is_default) ?? active[0])?.id ?? null;
}

/** Sale line snapshots of the appointment's services, in the appointment's order. */
export function saleItems(
  serviceIds: readonly string[],
  services: readonly { id: string; name: string; price: number }[],
): { service_id: string; name: string; price: number }[] {
  const byId = new Map(services.map((s) => [s.id, s]));
  return serviceIds.flatMap((id) => {
    const s = byId.get(id);
    return s ? [{ service_id: s.id, name: s.name, price: s.price }] : [];
  });
}
