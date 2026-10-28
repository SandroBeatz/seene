/**
 * The final onboarding write: draft → `complete_onboarding` payload → one RPC →
 * refresh the session profile (the root guard then opens the app) → clear the draft.
 *
 * The review screen (phase 7) is not built yet, so step 4 finishes for now.
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
        // A retry after the write landed but the profile refresh failed: the profile
        // exists, so just load it.
        if (error.kind !== 'already_completed') throw error;
      }
      await useSessionStore.getState().refreshProfile();
      useOnboardingDraft.getState().reset();
    },
  });
}
