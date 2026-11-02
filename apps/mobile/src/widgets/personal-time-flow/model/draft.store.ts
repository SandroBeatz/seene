/**
 * The personal time being put together in "Личное время", or moved from its preview.
 * Either way it is a sheet plus two small sheets over it (own time, month), so they
 * share the draft here. Not persisted: closing the sheet drops it.
 */
import { create } from 'zustand';

/** "Сколько": the lengths offered as chips, minutes. */
export const PERSONAL_LENGTHS = [15, 30, 60, 90, 120] as const;
export const DEFAULT_LENGTH = 60;

export interface PersonalTimeDraft {
  /** The time block being moved; null while creating one. */
  blockId: string | null;
  /** "yyyy-MM-dd" in the master's zone; null = today. */
  dayKey: string | null;
  /** The chosen start, UTC ISO. */
  start: string | null;
  /** The start was typed in "Своё время", not picked from the grid. */
  ownTime: boolean;
  /** The whole day: a day off, a holiday, sick leave. */
  allDay: boolean;
  /** Minutes. */
  length: number;
  title: string;
}

interface PersonalTimeState extends PersonalTimeDraft {
  /** Start moving a block: its day, length and name, the new start still to pick. */
  begin: (
    blockId: string,
    from: Pick<PersonalTimeDraft, 'dayKey' | 'allDay' | 'length' | 'title'>,
  ) => void;
  setDay: (dayKey: string) => void;
  setStart: (start: string | null, ownTime?: boolean) => void;
  setAllDay: (allDay: boolean) => void;
  setLength: (length: number) => void;
  setTitle: (title: string) => void;
  reset: () => void;
}

const EMPTY: PersonalTimeDraft = {
  blockId: null,
  dayKey: null,
  start: null,
  ownTime: false,
  allDay: false,
  length: DEFAULT_LENGTH,
  title: '',
};

export const usePersonalTimeDraft = create<PersonalTimeState>()((set) => ({
  ...EMPTY,
  begin: (blockId, from) => set({ ...EMPTY, ...from, blockId }),
  setDay: (dayKey) =>
    set((state) => (state.dayKey === dayKey ? state : { dayKey, start: null, ownTime: false })),
  setStart: (start, ownTime = false) => set({ start, ownTime }),
  setAllDay: (allDay) => set({ allDay }),
  // Another length: a start from the grid may no longer fit; a typed one stays.
  setLength: (length) => set((state) => ({ length, start: state.ownTime ? state.start : null })),
  setTitle: (title) => set({ title }),
  reset: () => set(EMPTY),
}));
