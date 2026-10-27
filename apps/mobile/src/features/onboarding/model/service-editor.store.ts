/**
 * The service being edited in the step-3 sheets. The service sheet and its two
 * child sheets (section, category) are separate native sheets, so they share the
 * working copy here; it reaches the draft only on "Сохранить" / "Добавить услугу".
 * Not persisted — an unsaved edit is dropped with the sheet.
 */
import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import type { SpecializationKey } from '@/shared/config/specializations';
import { DEFAULT_COLOR_KEY, type DraftService } from './services';

/** Which field the sheet opens on ("Добавить цену" → price). */
export type EditorFocus = 'name' | 'price';

interface ServiceEditorState {
  service: DraftService | null;
  isNew: boolean;
  focus: EditorFocus;
  edit: (service: DraftService, focus?: EditorFocus) => void;
  create: (specialization: SpecializationKey) => void;
  patch: (patch: Partial<DraftService>) => void;
  clear: () => void;
}

export const useServiceEditor = create<ServiceEditorState>()((set) => ({
  service: null,
  isNew: false,
  focus: 'name',
  edit: (service, focus = 'name') => set({ service: { ...service }, isNew: false, focus }),
  create: (specialization) =>
    set({
      isNew: true,
      focus: 'name',
      service: {
        id: randomUUID(),
        name: '',
        description: '',
        duration: 60,
        price: null,
        color: DEFAULT_COLOR_KEY,
        specialization,
        category: null,
        active: true,
        online: true,
        selected: true,
      },
    }),
  patch: (patch) =>
    set((state) => (state.service ? { service: { ...state.service, ...patch } } : state)),
  clear: () => set({ service: null }),
}));
