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
import { deviceTimeZone } from '@/shared/lib/time-zone';
import { DEFAULT_HOURS, type WorkingHours } from './hours';
import { type DraftService, forgetCatalogNames, syncWithProfessions } from './services';

export interface OnboardingDraftState {
  /** Owner of this draft; a mismatch with the session user resets it. */
  userId: string | null;
  firstName: string;
  lastName: string;
  username: string;
  specializations: SpecializationKey[];
  /** ISO 4217, from the phone until step 3 lets the master change it. */
  currency: string;
  /** Step 4 candidates (templates of the picked professions + own services). */
  services: DraftService[];
  /** Category names created on step 4 ("Без категории" = null on a service). */
  categories: string[];
  /** "Настрою потом" on step 4: finish without services (the picks are kept). */
  servicesSkipped: boolean;
  /** IANA zone, from the phone until changed on step 3. */
  timezone: string;
  hours: WorkingHours;
  onlineBooking: boolean;
  /** "Подтверждать вручную": online bookings wait for the master's yes. */
  manualConfirm: boolean;
}

/** Step-3 fields set through `setSettings`. */
export type DraftSettings = Pick<
  OnboardingDraftState,
  'timezone' | 'currency' | 'hours' | 'onlineBooking' | 'manualConfirm'
>;

interface OnboardingDraftActions {
  /** Start (or keep) the draft for this user; prefill the name once, if known. */
  begin: (
    userId: string,
    prefill: { firstName?: string; lastName?: string; currency: string; timezone: string },
  ) => void;
  setName: (patch: Partial<Pick<OnboardingDraftState, 'firstName' | 'lastName'>>) => void;
  setUsername: (username: string) => void;
  toggleSpecialization: (key: SpecializationKey) => void;
  /** Align step-4 services with the picked professions (on entering step 4). */
  syncServices: () => void;
  toggleService: (id: string) => void;
  /** Insert or replace by id (the service sheet's save). */
  saveService: (service: DraftService) => void;
  addCategory: (name: string) => void;
  setServicesSkipped: (skipped: boolean) => void;
  setSettings: (patch: Partial<DraftSettings>) => void;
  reset: () => void;
}

const EMPTY: OnboardingDraftState = {
  userId: null,
  firstName: '',
  lastName: '',
  username: '',
  specializations: [],
  currency: 'USD',
  services: [],
  categories: [],
  servicesSkipped: false,
  timezone: deviceTimeZone(),
  hours: DEFAULT_HOURS,
  onlineBooking: true,
  manualConfirm: false,
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
          firstName: prefill.firstName?.trim() ?? '',
          lastName: prefill.lastName?.trim() ?? '',
          currency: prefill.currency,
          timezone: prefill.timezone,
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
      syncServices: () =>
        set((state) => ({
          services: syncWithProfessions(state.services, state.specializations),
        })),
      toggleService: (id) =>
        set((state) => ({
          services: state.services.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s)),
        })),
      saveService: (service) =>
        set((state) => ({
          services: state.services.some((s) => s.id === service.id)
            ? state.services.map((s) => (s.id === service.id ? service : s))
            : [...state.services, service],
        })),
      addCategory: (name) =>
        set((state) => ({
          categories: state.categories.some((c) => c.toLowerCase() === name.toLowerCase())
            ? state.categories
            : [name, ...state.categories],
        })),
      setServicesSkipped: (servicesSkipped) => set({ servicesSkipped }),
      setSettings: (patch) => set(patch),
      reset: () => set(EMPTY),
    }),
    {
      name: 'seene.onboarding-draft',
      // v2 adds currency/services/categories; v3 stops storing catalog names;
      // v4 adds the "Основное" settings (merged in from EMPTY); v5 replaces the 'UTC'
      // placeholder an early v4 build stored with the phone's zone; v6 moves service
      // colours to the per-section palette (old picks reset to the section's colour).
      version: 6,
      migrate: (persisted, version) => {
        // Spread order keeps every saved field; new ones (phone timezone) come from EMPTY.
        const state = { ...EMPTY, ...(persisted as Partial<OnboardingDraftState>) };
        const timezone = version === 4 && state.timezone === 'UTC' ? deviceTimeZone() : state.timezone;
        const services = forgetCatalogNames(state.services).map((service) =>
          version < 6 ? { ...service, color: null } : service,
        );
        return { ...state, timezone, services };
      },
      storage: createJSONStorage(() => mmkvSyncStorage),
    },
  ),
);
