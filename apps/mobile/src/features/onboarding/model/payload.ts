/**
 * Draft → `complete_onboarding` payload. Pure (no stores, no device reads), so it is
 * unit-tested directly; `submit.ts` supplies the draft and the device context.
 */
import {
  type CompleteOnboardingPayload,
  defaultTimeFormatForCountry,
  toStoredSchedule,
} from '@/entities/master';
import type { AppLocale } from '@/shared/lib/i18n';
import type { OnboardingDraftState } from './draft.store';
import { toWeek } from './hours';
import { toServiceInput } from './services';

export interface DeviceContext {
  region: string;
  language: AppLocale;
  theme: CompleteOnboardingPayload['theme'];
}

export function buildPayload(
  draft: OnboardingDraftState,
  device: DeviceContext,
): CompleteOnboardingPayload {
  return {
    first_name: draft.firstName.trim(),
    last_name: draft.lastName.trim(),
    username: draft.username.trim(),
    specializations: draft.specializations,
    schedule: toStoredSchedule(toWeek(draft.hours), draft.timezone),
    currency: draft.currency,
    language: device.language,
    time_format: device.region ? defaultTimeFormatForCountry(device.region) : 24,
    theme: device.theme,
    online_booking_enabled: draft.onlineBooking,
    booking_default_status: draft.manualConfirm ? 'pending' : 'confirmed',
    services: draft.servicesSkipped
      ? []
      : draft.services.filter((s) => s.selected).map((s) => toServiceInput(s, device.language)),
  };
}
