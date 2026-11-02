/** The month calendar and "Своё время" over "Когда", bound to the draft. */
import { MonthSheet, OwnTimeSheet } from '@/features/pick-time';
import { usePersonalTimeDraft } from '../model/draft.store';

export function PersonalTimeMonthSheet() {
  const draft = usePersonalTimeDraft();
  return <MonthSheet duration={draft.length} value={draft.dayKey} onPick={draft.setDay} />;
}

export function PersonalTimeOwnTimeSheet() {
  const draft = usePersonalTimeDraft();
  return (
    <OwnTimeSheet
      purpose="personal"
      duration={draft.length}
      dayKey={draft.dayKey}
      value={draft.start}
      onDone={(start) => draft.setStart(start, true)}
    />
  );
}
