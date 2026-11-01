/**
 * "Запись создана" on "Сегодня" after the flow closes (design "После создания"):
 * who and when, and "Отправить клиенту" — WhatsApp with the details. Lives in memory:
 * it is about the appointment just made, not something to bring back after a restart.
 */
import { create } from 'zustand';

export interface CreatedAppointment {
  appointmentId: string;
  /** "Айгерим · пт 31 окт, 11:00–13:00". */
  summary: string;
  /** Canonical digits for WhatsApp; null when the client has no number. */
  phone: string | null;
  /** The ready text for the client. */
  message: string;
}

interface CreatedState {
  created: CreatedAppointment | null;
  show: (created: CreatedAppointment) => void;
  dismiss: () => void;
}

export const useCreatedAppointment = create<CreatedState>()((set) => ({
  created: null,
  show: (created) => set({ created }),
  dismiss: () => set({ created: null }),
}));
