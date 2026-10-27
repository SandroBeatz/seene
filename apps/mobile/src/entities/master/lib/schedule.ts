/** Converts the app's Monday-first week to the stored, weekday-keyed schedule. */
import { type StoredSchedule, WEEKDAYS, type WeeklySchedule } from '../model/types';

export function toStoredSchedule(week: WeeklySchedule, timezone: string): StoredSchedule {
  const days = Object.fromEntries(
    WEEKDAYS.map((day, index) => [day, week[index]]),
  ) as StoredSchedule['days'];
  return { timezone, days };
}
