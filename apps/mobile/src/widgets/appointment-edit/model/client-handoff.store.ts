/**
 * A client made in "Новый клиент" while changing an appointment's client: the form
 * leaves its id here, and the picker takes it when it is back on screen.
 */
import { create } from 'zustand';

interface ClientHandoffState {
  clientId: string | null;
  put: (clientId: string) => void;
  take: () => string | null;
}

export const useClientHandoff = create<ClientHandoffState>()((set, get) => ({
  clientId: null,
  put: (clientId) => set({ clientId }),
  take: () => {
    const clientId = get().clientId;
    if (clientId) set({ clientId: null });
    return clientId;
  },
}));
