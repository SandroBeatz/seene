/** Converts between the app's Monday-first week and the stored, weekday-keyed schedule. */
import type { Json } from '@/shared/api/database.types';
import {
  type DaySchedule,
  type StoredSchedule,
  WEEKDAYS,
  type WeeklySchedule,
} from '../model/types';

export function toStoredSchedule(week: WeeklySchedule, timezone: string): StoredSchedule {
  const days = Object.fromEntries(
    WEEKDAYS.map((day, index) => [day, week[index]]),
  ) as StoredSchedule['days'];
  return { timezone, days };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * `master_profile.schedule` (Json) → the stored shape, or null when it is missing or
 * malformed (rows written before the onboarding redesign). Days that are missing or
 * malformed read as days off.
 */
export function parseStoredSchedule(json: Json | null | undefined): StoredSchedule | null {
  if (!isRecord(json) || typeof json.timezone !== 'string' || !isRecord(json.days)) return null;
  const rawDays = json.days;
  const days = Object.fromEntries(
    WEEKDAYS.map((day): [string, DaySchedule] => {
      const raw = rawDays[day];
      if (!isRecord(raw) || typeof raw.start !== 'string' || typeof raw.end !== 'string') {
        return [day, { enabled: false, start: '00:00', end: '00:00', breaks: [] }];
      }
      const breaks = Array.isArray(raw.breaks)
        ? raw.breaks.filter(
            (b): b is { start: string; end: string } =>
              isRecord(b) && typeof b.start === 'string' && typeof b.end === 'string',
          )
        : [];
      return [day, { enabled: raw.enabled === true, start: raw.start, end: raw.end, breaks }];
    }),
  ) as StoredSchedule['days'];
  return { timezone: json.timezone, days };
}

/** The working day for a Monday-first weekday index (0 = Monday). */
export function scheduleForWeekday(schedule: StoredSchedule, weekdayIndex: number): DaySchedule {
  return schedule.days[WEEKDAYS[weekdayIndex]];
}
