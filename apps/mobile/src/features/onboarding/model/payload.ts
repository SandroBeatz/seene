/**
 * Draft → `complete_onboarding` payload. Pure (no stores, no device reads), so it is
 * unit-tested directly; `submit.ts` supplies the draft and the device context.
 */
import {
  type CompleteOnboardingPayload,
  type DaySchedule,
  defaultTimeFormatForCountry,
  toStoredSchedule,
  type WeeklySchedule,
} from '@/entities/master';
import type { AppLocale } from '@/shared/lib/i18n';
import type { OnboardingDraftState } from './draft.store';

const workday = (enabled: boolean): DaySchedule => ({
  enabled,
  start: '10:00',
  end: '19:00',
  breaks: [],
});

/** Design default: Mon–Sat, 10:00–19:00. */
export const DEFAULT_WEEK: WeeklySchedule = [
  workday(true),
  workday(true),
  workday(true),
  workday(true),
  workday(true),
  workday(true),
  workday(false),
];

export interface DeviceContext {
  timezone: string;
  currency: string;
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
    schedule: toStoredSchedule(DEFAULT_WEEK, device.timezone),
    currency: device.currency,
    language: device.language,
    time_format: device.region ? defaultTimeFormatForCountry(device.region) : 24,
    theme: device.theme,
    online_booking_enabled: true,
    booking_default_status: 'confirmed',
    services: [],
  };
}
