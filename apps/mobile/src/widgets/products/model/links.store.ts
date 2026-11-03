/**
 * The services a product comes off, while its form is open. They are picked on a sheet of their
 * own and saved with the form's button, so they wait here: the quantity as typed, by service.
 */
import { create } from 'zustand';

interface LinksState {
  links: Record<string, string>;
  begin: (links: Record<string, string>) => void;
  toggle: (serviceId: string) => void;
  setQuantity: (serviceId: string, quantity: string) => void;
}

export const useProductLinks = create<LinksState>()((set) => ({
  links: {},
  begin: (links) => set({ links }),
  toggle: (serviceId) =>
    set(({ links }) => {
      const { [serviceId]: removed, ...rest } = links;
      return { links: removed === undefined ? { ...links, [serviceId]: '1' } : rest };
    }),
  setQuantity: (serviceId, quantity) =>
    set(({ links }) => ({ links: { ...links, [serviceId]: quantity } })),
}));
