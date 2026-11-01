/**
 * The day and start being picked while moving a visit. The move is one sheet plus two
 * small sheets over it (month, own time), so they share the pick here. Not persisted:
 * opening the move for a visit starts it over.
 */
import { create } from 'zustand';

interface RescheduleState {
  appointmentId: string | null;
  /** "yyyy-MM-dd" in the master's zone. */
  dayKey: string | null;
  /** UTC ISO. */
  start: string | null;
  /** The start was typed in "Своё время", not picked from the grid. */
  ownTime: boolean;
  begin: (appointmentId: string, dayKey: string) => void;
  setDay: (dayKey: string) => void;
  setStart: (start: string | null, ownTime?: boolean) => void;
}

export const useRescheduleDraft = create<RescheduleState>()((set) => ({
  appointmentId: null,
  dayKey: null,
  start: null,
  ownTime: false,
  begin: (appointmentId, dayKey) => set({ appointmentId, dayKey, start: null, ownTime: false }),
  setDay: (dayKey) =>
    set((state) => (state.dayKey === dayKey ? state : { dayKey, start: null, ownTime: false })),
  setStart: (start, ownTime = false) => set({ start, ownTime }),
}));
