/**
 * Master-domain types. `WeeklySchedule` mirrors `master_profile.schedule` (a Json
 * column): 7 days, Monday-first, each with enabled + start/end wall-clock times and
 * optional breaks. Wall-clock strings are `HH:mm` in the master's timezone.
 */
import type { SpecializationKey } from '@/shared/config/specializations';
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

export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** `master_profile.schedule` as stored (shared with the web): weekday-keyed + IANA zone. */
export interface StoredSchedule {
  timezone: string;
  days: Record<Weekday, DaySchedule>;
}

/** One service written by `complete_onboarding`. No `price` → hidden online until set. */
export interface OnboardingServiceInput {
  name: string;
  /** Minutes, 5–1440. */
  duration: number;
  price?: number | null;
  price_from?: boolean;
  description?: string | null;
  /** `#RRGGBB` calendar colour. */
  color: string;
  specialization?: SpecializationKey | null;
  /** Category name; created once per distinct name. */
  category?: string | null;
  /** "Активна" — default true. */
  is_active?: boolean;
  /** "Онлайн-запись" — default true; always false without a price. */
  show_online?: boolean;
}

/** The `complete_onboarding` RPC payload — the whole onboarding in one write. */
export interface CompleteOnboardingPayload {
  first_name: string;
  last_name: string;
  username: string;
  specializations: SpecializationKey[];
  schedule: StoredSchedule;
  currency: string;
  language: 'en' | 'fr' | 'ru';
  time_format: TimeFormat;
  theme: 'auto' | 'light' | 'dark';
  online_booking_enabled: boolean;
  /** `pending` = the master confirms each online booking by hand. */
  booking_default_status: 'pending' | 'confirmed';
  services: OnboardingServiceInput[];
}
