/**
 * The end of onboarding, in two moves so the "creating" animation can play out:
 *
 * 1. `useCompleteOnboarding` — draft → `complete_onboarding` payload → one RPC.
 *    The session profile is not refreshed yet, so the root guard keeps the user here.
 * 2. `useEnterApp` — refresh the session profile (the root guard then opens the app)
 *    and clear the draft. Run on "Дальше" once the profile exists.
 */
import { useMutation } from '@tanstack/react-query';
import { completeOnboarding } from '@/entities/master';
import { useSessionStore } from '@/entities/session';
import { type AppError, normalizeError } from '@/shared/api/errors';
import { useOnboardingDraft } from './draft.store';
import { readDeviceContext } from './device';
import { buildPayload } from './payload';

export function useCompleteOnboarding() {
  return useMutation<void, AppError, void>({
    mutationFn: async () => {
      try {
        await completeOnboarding(buildPayload(useOnboardingDraft.getState(), readDeviceContext()));
      } catch (e) {
        const error = normalizeError(e);
        // A retry after the write landed (e.g. the response was lost): the profile
        // exists, which is all this step needs.
        if (error.kind !== 'already_completed') throw error;
      }
    },
  });
}

export function useEnterApp() {
  return useMutation<void, AppError, void>({
    mutationFn: async () => {
      try {
        await useSessionStore.getState().refreshProfile();
      } catch (e) {
        throw normalizeError(e);
      }
      useOnboardingDraft.getState().reset();
    },
  });
}
