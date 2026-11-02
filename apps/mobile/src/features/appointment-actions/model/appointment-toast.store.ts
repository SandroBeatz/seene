/**
 * The toast after a visit is created or moved (design "После создания"): what happened,
 * who and when, and "Отправить клиенту" — WhatsApp with the details. Lives in memory:
 * it is about what was just done, not something to bring back after a restart.
 */
import { create } from 'zustand';

export interface AppointmentToastData {
  /** "Запись создана" / "Запись перенесена". */
  title: string;
  /** "Айгерим · пт 31 окт, 11:00–13:00". */
  summary: string;
  /** Canonical digits for WhatsApp; null when the client has no number. */
  phone: string | null;
  /** The ready text for the client. */
  message: string;
}

interface AppointmentToastState {
  toast: AppointmentToastData | null;
  show: (toast: AppointmentToastData) => void;
  dismiss: () => void;
}

export const useAppointmentToast = create<AppointmentToastState>()((set) => ({
  toast: null,
  show: (toast) => set({ toast }),
  dismiss: () => set({ toast: null }),
}));
