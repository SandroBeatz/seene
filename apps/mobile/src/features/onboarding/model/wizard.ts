/**
 * Onboarding wizard state: the linear 5-step draft (docs/business-logic.md §3).
 * Data is held locally and written in one go at Step 5 — nothing touches the
 * backend mid-wizard except the username availability check.
 */
import { useCallback, useEffect, useState } from 'react';
import { getLocales } from 'expo-localization';
import {
  defaultTimeFormatForCountry,
  isUsernameSyntaxValid,
  type DaySchedule,
  type OnboardingDraft,
  type WeeklySchedule,
} from '@/entities/master';
import { deviceTimeZone } from '@/shared/lib/time-zone';

export const ONBOARDING_STEPS = [
  'specializations',
  'personal',
  'address',
  'schedule',
  'review',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];
export const STEP_COUNT = ONBOARDING_STEPS.length;

function workingDay(enabled: boolean): DaySchedule {
  return { enabled, start: '09:00', end: '18:00', breaks: [] };
}

/** Mon–Fri on, weekend off, by default. */
function defaultSchedule(): WeeklySchedule {
  return [
    workingDay(true),
    workingDay(true),
    workingDay(true),
    workingDay(true),
    workingDay(true),
    workingDay(false),
    workingDay(false),
  ];
}

export function createDraft(): OnboardingDraft {
  const region = getLocales()[0]?.regionCode ?? '';
  return {
    specializations: [],
    first_name: '',
    last_name: '',
    phone: '',
    username: '',
    country: region,
    address: '',
    house_number: '',
    zip_code: '',
    city: '',
    works_at_place: false,
    can_travel: false,
    schedule: defaultSchedule(),
    time_zone: deviceTimeZone(),
    time_format: region ? defaultTimeFormatForCountry(region) : 24,
  };
}

export interface WizardApi {
  draft: OnboardingDraft;
  step: number;
  update: (patch: Partial<OnboardingDraft>) => void;
  setStep: (step: number) => void;
}

/** Debounce a rapidly-changing value so the username RPC only fires when typing settles. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function useOnboardingWizard(): WizardApi {
  const [draft, setDraft] = useState<OnboardingDraft>(createDraft);
  const [step, setStep] = useState(0);
  const update = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);
  return { draft, step, update, setStep };
}

/**
 * Per-step "can advance" gate. Step 2's username needs a live availability result,
 * passed in from the wizard's query (undefined = still checking / not yet valid).
 */
export function canAdvance(
  step: number,
  draft: OnboardingDraft,
  usernameAvailable: boolean | undefined,
): boolean {
  switch (ONBOARDING_STEPS[step]) {
    case 'specializations':
      return draft.specializations.length >= 1;
    case 'personal':
      return (
        draft.first_name.trim().length > 0 &&
        draft.last_name.trim().length > 0 &&
        draft.phone.trim().length >= 6 &&
        isUsernameSyntaxValid(draft.username) &&
        usernameAvailable === true
      );
    case 'address':
      return draft.country.trim().length > 0;
    case 'schedule':
      return draft.schedule.some((d) => d.enabled) && draft.time_zone.trim().length > 0;
    case 'review':
      return true;
    default:
      return false;
  }
}
