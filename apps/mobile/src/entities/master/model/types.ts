/**
 * Master-domain types. `WeeklySchedule` mirrors `master_profile.schedule` (a Json
 * column): 7 days, Monday-first, each with enabled + start/end wall-clock times and
 * optional breaks. Wall-clock strings are `HH:mm` in the master's timezone.
 */
import type { SpecializationKey } from '../config/specializations';
import type { TimeFormat } from '../config/time-format';

export interface TimeRange {
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

export interface DaySchedule {
  enabled: boolean;
  start: string; // "HH:mm"
  end: string; // "HH:mm"
  breaks: TimeRange[];
}

/** Index 0 = Monday … 6 = Sunday. */
export type WeeklySchedule = [
  DaySchedule,
  DaySchedule,
  DaySchedule,
  DaySchedule,
  DaySchedule,
  DaySchedule,
  DaySchedule,
];

/** Everything the onboarding wizard collects before the Step 5 write. */
export interface OnboardingDraft {
  specializations: SpecializationKey[];
  first_name: string;
  last_name: string;
  phone: string;
  username: string;
  country: string;
  address: string;
  house_number: string;
  zip_code: string;
  city: string;
  works_at_place: boolean;
  can_travel: boolean;
  schedule: WeeklySchedule;
  time_zone: string;
  time_format: TimeFormat;
}
