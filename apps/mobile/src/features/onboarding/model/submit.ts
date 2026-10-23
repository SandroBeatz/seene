/**
 * Step 5 write: INSERT master_profile → UPSERT master_settings (non-fatal) →
 * refresh the session profile so the guard routes to home. Mirrors the web's
 * single-transaction finish (docs/business-logic.md §3 Step 5).
 */
import { useMutation } from '@tanstack/react-query';
import { createMasterProfile, type OnboardingDraft, upsertMasterSettings } from '@/entities/master';
import { useSessionStore } from '@/entities/session';
import { type AppError, normalizeError } from '@/shared/api/errors';
import { useLocaleStore } from '@/shared/lib/i18n';
import { useThemeStore } from '@/shared/theme/theme.store';

export function useCompleteOnboarding() {
  return useMutation<void, AppError, OnboardingDraft>({
    mutationFn: async (draft: OnboardingDraft) => {
      const userId = useSessionStore.getState().session?.user.id;
      if (!userId) throw { kind: 'unauthorized' as const };

      try {
        await createMasterProfile(userId, draft);
      } catch (e) {
        throw normalizeError(e);
      }

      // Settings are a best-effort follow-up — a failure must not block onboarding.
      try {
        await upsertMasterSettings(userId, {
          time_format: draft.time_format,
          language: useLocaleStore.getState().locale ?? 'en',
          theme: useThemeStore.getState().mode,
        });
      } catch (e) {
        if (__DEV__) console.warn('[onboarding] master_settings upsert failed (non-fatal)', e);
      }

      await useSessionStore.getState().refreshProfile();
    },
  });
}
