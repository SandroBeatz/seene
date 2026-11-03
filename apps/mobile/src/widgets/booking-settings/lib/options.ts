/** The values "Онлайн-запись" offers. Pure. Limits follow the columns' CHECKs. */
import type { MasterSettings } from '@/entities/master';

export const BOOKING_OPTIONS = {
  /** Minutes. */
  notice: { column: 'booking_min_notice_minutes', values: [0, 30, 60, 120, 180, 240, 360, 720, 1440] },
  /** Days, 1–90. */
  horizon: { column: 'booking_horizon_days', values: [7, 14, 30, 60, 90] },
  /** Minutes, up to 120. */
  step: { column: 'calendar_slot_step_minutes', values: [5, 10, 15, 20, 30, 60] },
  /** Minutes, up to 240. */
  buffer: { column: 'booking_buffer_minutes', values: [0, 5, 10, 15, 20, 30, 45, 60] },
  /** Hours, up to 168. */
  cancel: { column: 'cancel_window_hours', values: [0, 1, 2, 3, 6, 12, 24, 48] },
} as const;

export type BookingOption = keyof typeof BOOKING_OPTIONS;

export const isBookingOption = (value: unknown): value is BookingOption =>
  typeof value === 'string' && value in BOOKING_OPTIONS;

/** A setting's current value; a missing one reads as the booking page's own default. */
export function optionValue(settings: MasterSettings, option: BookingOption): number {
  const fallback = { notice: 0, horizon: 14, step: 15, buffer: 0, cancel: 12 }[option];
  return settings[BOOKING_OPTIONS[option].column] ?? fallback;
}

/** The list, with a saved value that isn't on it kept in its place. */
export function optionValues(option: BookingOption, current: number): number[] {
  const values: readonly number[] = BOOKING_OPTIONS[option].values;
  return values.includes(current) ? [...values] : [...values, current].sort((a, b) => a - b);
}
