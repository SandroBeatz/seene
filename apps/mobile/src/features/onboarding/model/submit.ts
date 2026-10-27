/**
 * The final onboarding write: draft → `complete_onboarding` payload → one RPC →
 * refresh the session profile (the root guard then opens the app) → clear the draft.
 *
 * Steps 3–4 (services, settings) are not built yet, so their values come from the
 * phone for now: device timezone/currency/time format, Mon–Sat 10–19, online
 * booking on, auto-confirm (the design's step-4 defaults), no services.
 */
import { useMutation } from '@tanstack/react-query';
import { getLocales } from 'expo-localization';
import { completeOnboarding } from '@/entities/master';
import { useSessionStore } from '@/entities/session';
import { type AppError, normalizeError } from '@/shared/api/errors';
import { i18n, isSupportedLocale } from '@/shared/lib/i18n';
import { deviceTimeZone } from '@/shared/lib/time-zone';
import { useThemeStore } from '@/shared/theme/theme.store';
import { useOnboardingDraft } from './draft.store';
import { buildPayload, type DeviceContext } from './payload';

export function readDeviceContext(): DeviceContext {
  const locale = getLocales()[0];
  return {
    timezone: deviceTimeZone(),
    currency: locale?.currencyCode ?? 'USD',
    region: locale?.regionCode ?? '',
    language: isSupportedLocale(i18n.language) ? i18n.language : 'en',
    theme: useThemeStore.getState().mode,
  };
}

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
