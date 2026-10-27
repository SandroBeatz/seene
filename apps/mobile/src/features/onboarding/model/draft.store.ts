/**
 * Onboarding draft — everything the 4 steps collect before the single
 * `complete_onboarding` write. Persisted to MMKV so quitting the app mid-way keeps
 * what was typed; tied to the signed-in user, so a different account starts clean.
 *
 * Steps read/write slices through the store; nothing reaches the backend until the
 * final write except the username availability check.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvSyncStorage } from '@/shared/api/storage';
import type { SpecializationKey } from '@/shared/config/specializations';

export interface OnboardingDraftState {
  /** Owner of this draft; a mismatch with the session user resets it. */
  userId: string | null;
  firstName: string;
  lastName: string;
  username: string;
  specializations: SpecializationKey[];
}

interface OnboardingDraftActions {
  /** Start (or keep) the draft for this user; prefill the name once, if known. */
  begin: (userId: string, prefill?: { firstName?: string; lastName?: string }) => void;
  setName: (patch: Partial<Pick<OnboardingDraftState, 'firstName' | 'lastName'>>) => void;
  setUsername: (username: string) => void;
  toggleSpecialization: (key: SpecializationKey) => void;
  reset: () => void;
}

const EMPTY: OnboardingDraftState = {
  userId: null,
  firstName: '',
  lastName: '',
  username: '',
  specializations: [],
};

export const useOnboardingDraft = create<OnboardingDraftState & OnboardingDraftActions>()(
  persist(
    (set, get) => ({
      ...EMPTY,
      begin: (userId, prefill) => {
        if (get().userId === userId) return;
        set({
          ...EMPTY,
          userId,
          firstName: prefill?.firstName?.trim() ?? '',
          lastName: prefill?.lastName?.trim() ?? '',
        });
      },
      setName: (patch) => set(patch),
      setUsername: (username) => set({ username }),
      toggleSpecialization: (key) => {
        const current = get().specializations;
        set({
          specializations: current.includes(key)
            ? current.filter((k) => k !== key)
            : [...current, key],
        });
      },
      reset: () => set(EMPTY),
    }),
    {
      name: 'seene.onboarding-draft',
      version: 1,
      storage: createJSONStorage(() => mmkvSyncStorage),
    },
  ),
);
