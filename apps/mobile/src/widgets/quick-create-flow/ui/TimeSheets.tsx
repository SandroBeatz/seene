/** The month calendar and "Своё время" over the time step, bound to the draft. */
import { MonthSheet, OwnTimeSheet } from '@/features/pick-time';
import { useFlowData } from '../model/useFlowData';

export function QuickCreateMonthSheet() {
  const { draft, duration } = useFlowData();
  return <MonthSheet duration={duration} value={draft.dayKey} onPick={draft.setDay} />;
}

export function QuickCreateOwnTimeSheet() {
  const { draft, duration } = useFlowData();
  return (
    <OwnTimeSheet
      duration={duration}
      dayKey={draft.dayKey}
      value={draft.start}
      onDone={(start) => draft.setStart(start, true)}
    />
  );
}
