/** Which messages make sense for a visit in its current state (the "Шаблон" button). Pure. */
import type { Appointment, AppointmentPhase } from '@/entities/appointment';
import type { MessageKind } from '@/entities/message-template';

const BY_PHASE: Record<Exclude<AppointmentPhase, 'cancelled'>, readonly MessageKind[]> = {
  request: ['confirmation'],
  unconfirmed: ['confirmation'],
  overdue: ['recall'],
  upcoming: ['reminder', 'confirmation', 'reschedule'],
  // The client is in the chair.
  ongoing: [],
  awaiting: ['thanks', 'recall'],
  completed: ['thanks', 'recall'],
  no_show: ['missed', 'recall'],
  expired: ['recall'],
};

export function visitTemplates(
  phase: AppointmentPhase,
  cancelledBy: Appointment['cancelled_by'],
): readonly MessageKind[] {
  if (phase !== 'cancelled') return BY_PHASE[phase];
  // Clients who cancelled know it already.
  return cancelledBy === 'client' ? ['recall'] : ['cancellation', 'recall'];
}
