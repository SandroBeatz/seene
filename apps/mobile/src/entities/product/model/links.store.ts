/**
 * Product-to-service links while a form is open. They are picked on a sheet of their own and
 * saved with the form's button, so they wait here: the quantity as typed, by the other side's id.
 */
import { create } from 'zustand';

interface LinksState {
  links: Record<string, string>;
  begin: (links: Record<string, string>) => void;
  toggle: (id: string) => void;
  setQuantity: (id: string, quantity: string) => void;
}

export const createLinksStore = () =>
  create<LinksState>()((set) => ({
    links: {},
    begin: (links) => set({ links }),
    toggle: (id) =>
      set(({ links }) => {
        const { [id]: removed, ...rest } = links;
        return { links: removed === undefined ? { ...links, [id]: '1' } : rest };
      }),
    setQuantity: (id, quantity) => set(({ links }) => ({ links: { ...links, [id]: quantity } })),
  }));
