/** The month calendar and "Своё время" over the move, bound to its pick. */
import type { Appointment } from '@/entities/appointment';
import { MonthSheet, OwnTimeSheet } from '@/features/pick-time';
import { useRescheduleDraft } from '../model/reschedule.store';

export function RescheduleMonthSheet({ appointment }: { appointment: Appointment }) {
  const draft = useRescheduleDraft();
  return (
    <MonthSheet
      duration={appointment.duration}
      excludeId={appointment.id}
      value={draft.dayKey}
      onPick={draft.setDay}
    />
  );
}

export function RescheduleOwnTimeSheet({ appointment }: { appointment: Appointment }) {
  const draft = useRescheduleDraft();
  return (
    <OwnTimeSheet
      duration={appointment.duration}
      excludeId={appointment.id}
      dayKey={draft.dayKey}
      value={draft.start}
      onDone={(start) => draft.setStart(start, true)}
    />
  );
}
