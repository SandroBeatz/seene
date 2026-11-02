/** The day last opened in the day view: the month view returns to its month and marks it. */
import { create } from 'zustand';

interface CalendarSelection {
  dayKey: string | null;
  setDayKey: (dayKey: string) => void;
}

export const useCalendarSelection = create<CalendarSelection>()((set) => ({
  dayKey: null,
  setDayKey: (dayKey) => set({ dayKey }),
}));
