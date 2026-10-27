/**
 * The final onboarding write: draft → `complete_onboarding` payload → one RPC →
 * refresh the session profile (the root guard then opens the app) → clear the draft.
 *
 * Step 4 (settings) is not built yet, so its values come from the phone for now:
 * device timezone/time format, Mon–Sat 10–19, online booking on, auto-confirm (the
 * design's step-4 defaults).
 */
import { useMutation } from '@tanstack/react-query';
import { completeOnboarding } from '@/entities/master';
import { useSessionStore } from '@/entities/session';
import { type AppError, normalizeError } from '@/shared/api/errors';
import { useOnboardingDraft } from './draft.store';
import { readDeviceContext } from './device';
import { type BuildOptions, buildPayload } from './payload';

export function useCompleteOnboarding() {
  return useMutation<void, AppError, BuildOptions | void>({
    mutationFn: async (options) => {
      try {
        await completeOnboarding(
          buildPayload(useOnboardingDraft.getState(), readDeviceContext(), options ?? {}),
        );
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
