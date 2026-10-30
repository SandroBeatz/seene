/**
 * "Требуют внимания" on "Сегодня": the seven card kinds, in the design's order, each
 * with its tone and two inline actions. Pure, `now`-injected; dismissals ("Понятно",
 * "Позже", reminders sent) come in as keys so storage stays outside.
 */
import {
  getAppointmentPhase,
  isShownInSchedule,
  type Appointment,
  type StatusTone,
} from '@/entities/appointment';
import type { TimeInterval } from '@/shared/lib/scheduling';

export type AttentionKind =
  | 'new_request'
  | 'awaiting_completion'
  | 'overdue_request'
  | 'unconfirmed'
  | 'client_cancelled'
  | 'tomorrow_reminders'
  | 'recall';

export type AttentionAction =
  | 'confirm'
  | 'decline'
  | 'complete'
  | 'no_show'
  | 'propose_time'
  | 'call'
  | 'message'
  | 'dismiss'
  | 'send_reminders'
  | 'snooze'
  | 'invite';

export const ATTENTION_ORDER: readonly AttentionKind[] = [
  'new_request',
  'awaiting_completion',
  'overdue_request',
  'unconfirmed',
  'client_cancelled',
  'tomorrow_reminders',
  'recall',
];

export const ATTENTION_TONE: Record<AttentionKind, StatusTone> = {
  new_request: 'brand',
  awaiting_completion: 'neutral',
  overdue_request: 'danger',
  unconfirmed: 'warning',
  client_cancelled: 'muted',
  tomorrow_reminders: 'success',
  recall: 'info',
};

/** The card's round buttons: `secondary` (light) then `primary` (ink). */
export const ATTENTION_ACTIONS: Record<
  AttentionKind,
  { secondary: AttentionAction | null; primary: AttentionAction }
> = {
  new_request: { secondary: 'decline', primary: 'confirm' },
  awaiting_completion: { secondary: 'no_show', primary: 'complete' },
  overdue_request: { secondary: 'decline', primary: 'propose_time' },
  unconfirmed: { secondary: 'call', primary: 'message' },
  client_cancelled: { secondary: 'dismiss', primary: 'propose_time' },
  tomorrow_reminders: { secondary: null, primary: 'send_reminders' },
  recall: { secondary: 'snooze', primary: 'invite' },
};

type AttentionAppointment = Pick<
  Appointment,
  'id' | 'status' | 'source' | 'start_at' | 'duration' | 'client_id' | 'cancelled_by'
>;

export interface RecallCandidate {
  clientId: string;
  cadenceDays: number;
  sinceDays: number;
}

export type AttentionItem<A extends AttentionAppointment> =
  | {
      kind: Exclude<AttentionKind, 'tomorrow_reminders' | 'recall'>;
      key: string;
      appointment: A;
    }
  | { kind: 'tomorrow_reminders'; key: string; appointments: A[] }
  | ({ kind: 'recall'; key: string } & RecallCandidate);

export interface AttentionInput<A extends AttentionAppointment> {
  /** Recent and upcoming appointments, any status (incl. cancelled). */
  appointments: readonly A[];
  /** Tomorrow in the master's zone, for the reminder card. */
  tomorrow: TimeInterval & { dayKey: string };
  /** Clients already found due by `recallState`. */
  recalls: readonly RecallCandidate[];
  /** Keys of cards the master closed (see `key`). */
  dismissed: ReadonlySet<string>;
  now: number;
}

const PHASE_KIND = {
  request: 'new_request',
  awaiting: 'awaiting_completion',
  overdue: 'overdue_request',
  unconfirmed: 'unconfirmed',
} as const;

const startMs = (a: { start_at: string }) => new Date(a.start_at).getTime();

/** Stable dismissal key of a card. */
export function attentionKey(kind: AttentionKind, id: string): string {
  return `${kind}:${id}`;
}

export function buildAttentionItems<A extends AttentionAppointment>({
  appointments,
  tomorrow,
  recalls,
  dismissed,
  now,
}: AttentionInput<A>): AttentionItem<A>[] {
  const items: AttentionItem<A>[] = [];
  const sorted = [...appointments].sort((a, b) => startMs(a) - startMs(b));

  for (const appointment of sorted) {
    const phase = getAppointmentPhase(appointment, now);
    let kind: Exclude<AttentionKind, 'tomorrow_reminders' | 'recall'> | null = null;
    if (phase in PHASE_KIND) kind = PHASE_KIND[phase as keyof typeof PHASE_KIND];
    else if (
      phase === 'cancelled' &&
      appointment.cancelled_by === 'client' &&
      startMs(appointment) > now
    ) {
      kind = 'client_cancelled';
    }
    if (kind) items.push({ kind, key: attentionKey(kind, appointment.id), appointment });
  }

  const from = new Date(tomorrow.start).getTime();
  const to = new Date(tomorrow.end).getTime();
  const tomorrowVisits = sorted.filter(
    (a) =>
      isShownInSchedule(a) && a.status !== 'completed' && startMs(a) >= from && startMs(a) < to,
  );
  if (tomorrowVisits.length) {
    items.push({
      kind: 'tomorrow_reminders',
      key: attentionKey('tomorrow_reminders', tomorrow.dayKey),
      appointments: tomorrowVisits,
    });
  }

  for (const recall of [...recalls].sort((a, b) => b.sinceDays - a.sinceDays)) {
    items.push({ kind: 'recall', key: attentionKey('recall', recall.clientId), ...recall });
  }

  const rank = (kind: AttentionKind) => ATTENTION_ORDER.indexOf(kind);
  return items
    .filter((item) => !dismissed.has(item.key))
    .sort((a, b) => rank(a.kind) - rank(b.kind)); // stable: keeps start order within a kind
}
