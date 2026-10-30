/** Master entity — public barrel. Profile/settings writes live behind the api; the
 * onboarding feature composes them with the session store. */
export { defaultTimeFormatForCountry, type TimeFormat } from './config/time-format';
export { completeOnboarding, importAvatar } from './api/master.api';
export { toStoredSchedule, parseStoredSchedule, scheduleForWeekday } from './lib/schedule';
export {
  masterKeys,
  useMasterProfileQuery,
  useMasterSettingsQuery,
  useUsernameAvailability,
  isUsernameSyntaxValid,
  MIN_USERNAME_LENGTH,
} from './model/queries';
export { WEEKDAYS } from './model/types';
export type {
  CompleteOnboardingPayload,
  MasterProfile,
  MasterSettings,
  OnboardingServiceInput,
  StoredSchedule,
  Weekday,
  WeeklySchedule,
  DaySchedule,
  TimeRange,
} from './model/types';
