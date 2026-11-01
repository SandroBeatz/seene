/**
 * The appointment being put together in "Новая запись". The flow is one modal with
 * its own Stack (client → services → date and time → review) plus two small sheets
 * (own time, month), so the steps share the draft here. Not persisted: closing the
 * modal drops it, the next "+" starts clean.
 */
import { create } from 'zustand';

export interface QuickCreateDraft {
  clientId: string | null;
  serviceIds: string[];
  /** The day being looked at, "yyyy-MM-dd" in the master's zone. */
  dayKey: string | null;
  /** The chosen start, UTC ISO. */
  start: string | null;
  /** The start was typed in "Своё время", not picked from the grid. */
  ownTime: boolean;
  /** Typed price for this appointment; null = as in the price list. */
  price: string | null;
  note: string;
  /** A client was just created from step 1: go on to the services. */
  advance: boolean;
}

interface QuickCreateState extends QuickCreateDraft {
  setClient: (clientId: string, advance?: boolean) => void;
  consumeAdvance: () => boolean;
  toggleService: (serviceId: string) => void;
  setDay: (dayKey: string) => void;
  setStart: (start: string | null, ownTime?: boolean) => void;
  setPrice: (price: string | null) => void;
  setNote: (note: string) => void;
  reset: () => void;
}

const EMPTY: QuickCreateDraft = {
  clientId: null,
  serviceIds: [],
  dayKey: null,
  start: null,
  ownTime: false,
  price: null,
  note: '',
  advance: false,
};

export const useQuickCreateDraft = create<QuickCreateState>()((set, get) => ({
  ...EMPTY,
  setClient: (clientId, advance = false) => set({ clientId, advance }),
  consumeAdvance: () => {
    const advance = get().advance;
    if (advance) set({ advance: false });
    return advance;
  },
  toggleService: (serviceId) =>
    set((state) => ({
      serviceIds: state.serviceIds.includes(serviceId)
        ? state.serviceIds.filter((id) => id !== serviceId)
        : [...state.serviceIds, serviceId],
      // Another length: the picked time may no longer fit, and the price follows the list.
      start: state.ownTime ? state.start : null,
      price: null,
    })),
  setDay: (dayKey) =>
    set((state) => (state.dayKey === dayKey ? state : { dayKey, start: null, ownTime: false })),
  setStart: (start, ownTime = false) => set({ start, ownTime }),
  setPrice: (price) => set({ price }),
  setNote: (note) => set({ note }),
  reset: () => set(EMPTY),
}));
