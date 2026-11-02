/** The month calendar and "Своё время" over "Когда" or a move, bound to the draft. */
import { MonthSheet, OwnTimeSheet } from '@/features/pick-time';
import { usePersonalTimeDraft } from '../model/draft.store';

/** `excludeId`: the block being moved — its own time is free. */
export function PersonalTimeMonthSheet({ excludeId }: { excludeId?: string }) {
  const draft = usePersonalTimeDraft();
  return (
    <MonthSheet
      duration={draft.length}
      excludeId={excludeId}
      value={draft.dayKey}
      onPick={draft.setDay}
    />
  );
}

export function PersonalTimeOwnTimeSheet({ excludeId }: { excludeId?: string }) {
  const draft = usePersonalTimeDraft();
  return (
    <OwnTimeSheet
      purpose="personal"
      duration={draft.length}
      excludeId={excludeId}
      dayKey={draft.dayKey}
      value={draft.start}
      onDone={(start) => draft.setStart(start, true)}
    />
  );
}
