/** Master entity — public barrel. Profile/settings writes live behind the api; the
 * onboarding feature composes them with the session store. */
export { SPECIALIZATION_KEYS, type SpecializationKey } from './config/specializations';
export { defaultTimeFormatForCountry, type TimeFormat } from './config/time-format';
export { createMasterProfile, upsertMasterSettings } from './api/master.api';
export {
  useUsernameAvailability,
  isUsernameSyntaxValid,
  MIN_USERNAME_LENGTH,
} from './model/queries';
export type {
  OnboardingDraft,
  WeeklySchedule,
  DaySchedule,
  TimeRange,
} from './model/types';
