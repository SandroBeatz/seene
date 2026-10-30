/**
 * How an appointment looks and what the master can do with it (design: "Запись ·
 * превью", "Сегодня" schedule). Pure, `now`-injected, no entity imports: services
 * come in as a `{ color }` lookup so the colour rule stays free of the service entity.
 */
import type { Appointment } from '../model/types';
import { appointmentEndMs } from './derive';

/**
 * The visual status. Splits the stored statuses by time and source:
 * - `request` — online booking waiting for the master (pending, online, not started);
 * - `unconfirmed` — the master's own booking not yet confirmed (pending, manual);
 * - `overdue` — still pending after its start time;
 * - `upcoming` / `ongoing` / `awaiting` — confirmed before / during / after its window;
 * - `completed`, `cancelled`, `no_show`, `expired` — final.
 */
export type AppointmentPhase =
  | 'request'
  | 'unconfirmed'
  | 'overdue'
  | 'upcoming'
  | 'ongoing'
  | 'awaiting'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'expired';

type PhaseInput = Pick<Appointment, 'status' | 'source' | 'start_at' | 'duration'>;

export function getAppointmentPhase(a: PhaseInput, now: number = Date.now()): AppointmentPhase {
  const start = new Date(a.start_at).getTime();
  switch (a.status) {
    case 'pending':
      if (now >= start) return 'overdue';
      return a.source === 'online_booking' ? 'request' : 'unconfirmed';
    case 'confirmed':
      if (now < start) return 'upcoming';
      return now < appointmentEndMs(a) ? 'ongoing' : 'awaiting';
    default:
      return a.status;
  }
}

/** Semantic colour family of a status pill or attention card; the theme maps it. */
export type StatusTone = 'neutral' | 'brand' | 'warning' | 'success' | 'danger' | 'muted' | 'info';

export const PHASE_TONE: Record<AppointmentPhase, StatusTone> = {
  request: 'brand',
  unconfirmed: 'warning',
  overdue: 'danger',
  upcoming: 'neutral',
  ongoing: 'brand',
  awaiting: 'warning',
  completed: 'success',
  cancelled: 'muted',
  no_show: 'danger',
  expired: 'muted',
};

/** Statuses the schedule renders (matches the `appointment_day_counts` RPC). */
export function isShownInSchedule(a: Pick<Appointment, 'status'>): boolean {
  return a.status === 'pending' || a.status === 'confirmed' || a.status === 'completed';
}

export interface ScheduleCardLook {
  /** Ended: drawn at reduced opacity. */
  dimmed: boolean;
  /** Not confirmed: dashed outline in the service colour + warning icon. */
  unconfirmed: boolean;
}

export function scheduleCardLook(a: PhaseInput, now: number = Date.now()): ScheduleCardLook {
  return {
    dimmed: appointmentEndMs(a) <= now,
    unconfirmed: a.status === 'pending',
  };
}

export type AppointmentAction =
  | 'confirm'
  | 'decline'
  | 'complete'
  | 'reschedule'
  | 'cancel'
  | 'no_show'
  | 'propose_time'
  | 'book_again'
  | 'edit';

/**
 * The preview's bottom bar: a primary pill in the middle and an action on each side
 * (`null` = empty slot). `timer` = the ongoing variant, a single "47:12 Завершить".
 */
export interface PreviewActions {
  start: AppointmentAction | null;
  primary: AppointmentAction | null;
  end: AppointmentAction | null;
  timer: boolean;
}

const bar = (
  start: AppointmentAction | null,
  primary: AppointmentAction | null,
  end: AppointmentAction | null,
  timer = false,
): PreviewActions => ({ start, primary, end, timer });

export const PREVIEW_ACTIONS: Record<AppointmentPhase, PreviewActions> = {
  request: bar('decline', 'confirm', 'reschedule'),
  unconfirmed: bar('reschedule', 'confirm', 'cancel'),
  overdue: bar('decline', 'propose_time', null),
  upcoming: bar('reschedule', 'complete', 'cancel'),
  ongoing: bar(null, 'complete', null, true),
  awaiting: bar('no_show', 'complete', 'reschedule'),
  completed: bar('book_again', null, 'edit'),
  cancelled: bar('book_again', null, null),
  no_show: bar('book_again', null, null),
  expired: bar('book_again', null, null),
};

/** Actions drawn in the danger colour. */
export const DESTRUCTIVE_ACTIONS: ReadonlySet<AppointmentAction> = new Set([
  'decline',
  'cancel',
  'no_show',
]);

export interface VisitProgress {
  elapsedMinutes: number;
  plannedMinutes: number;
  /** 0–1, for the progress bar. */
  ratio: number;
  overtime: boolean;
}

/** The ongoing visit's timer: whole minutes since start against the planned duration. */
export function visitProgress(
  a: Pick<Appointment, 'start_at' | 'duration'>,
  now: number = Date.now(),
): VisitProgress {
  const elapsed = Math.max(0, Math.floor((now - new Date(a.start_at).getTime()) / 60_000));
  return {
    elapsedMinutes: elapsed,
    plannedMinutes: a.duration,
    ratio: a.duration > 0 ? Math.min(1, elapsed / a.duration) : 1,
    overtime: elapsed > a.duration,
  };
}

/** Whole minutes until the start ("через 2 ч"); negative once started. */
export function minutesUntilStart(a: Pick<Appointment, 'start_at'>, now: number = Date.now()): number {
  return Math.ceil((new Date(a.start_at).getTime() - now) / 60_000);
}

/**
 * The appointment's colour: its first service that still exists. A deleted service
 * is skipped; with none left, `fallback` (the default section colour).
 */
export function appointmentColor(
  serviceIds: readonly string[],
  services: ReadonlyMap<string, { color: string }>,
  fallback: string,
): string {
  for (const id of serviceIds) {
    const service = services.get(id);
    if (service) return service.color;
  }
  return fallback;
}
