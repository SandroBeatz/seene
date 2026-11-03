/**
 * The toast after a visit is created or moved (design "После создания"): what happened,
 * who and when, and "Отправить клиенту" — WhatsApp with the details. Lives in memory:
 * it is about what was just done, not something to bring back after a restart.
 */
import { create } from 'zustand';

export interface AppointmentToastData {
  /** "Запись создана" / "Запись перенесена" / "Запись отменена". */
  title: string;
  /** "Айгерим · пт 31 окт, 11:00–13:00". */
  summary: string;
  /** Canonical digits for WhatsApp; null when the client has no number. */
  phone: string | null;
  /** The text for the client, made when the master sends it: it may mint a personal link. */
  message: () => Promise<string>;
}

interface AppointmentToastState {
  /** `id`: a new one per toast, even with the same text. */
  toast: (AppointmentToastData & { id: number }) | null;
  show: (toast: AppointmentToastData) => void;
  dismiss: () => void;
}

let lastId = 0;

export const useAppointmentToast = create<AppointmentToastState>()((set) => ({
  toast: null,
  show: (toast) => set({ toast: { ...toast, id: ++lastId } }),
  dismiss: () => set({ toast: null }),
}));
