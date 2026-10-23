/**
 * Timezone-critical conversions. Scheduling is the app's core (RS-1): store UTC,
 * display/edit in the master's IANA zone — never do ad-hoc `Date` math.
 * All functions are pure and unit-tested. Ports the web time-zone helpers.
 */
import { DateTime } from 'luxon';

/** Wall-clock components as shown to the master (no zone attached). */
export interface WallClock {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
}

/** Current instant as a UTC ISO string. */
export function nowUtcIso(): string {
  return DateTime.utc().toISO()!;
}

/** UTC ISO → Luxon DateTime in the given IANA zone. */
export function zonedDateTime(utcIso: string, zone: string): DateTime {
  return DateTime.fromISO(utcIso, { zone: 'utc' }).setZone(zone);
}

/**
 * Wall-clock in a zone → UTC ISO instant.
 * e.g. { 2026,8,19, 14,30 } in 'Europe/Paris' → the correct UTC instant.
 */
export function toUtcIsoFromWallClock(wall: WallClock, zone: string): string {
  const dt = DateTime.fromObject(
    { year: wall.year, month: wall.month, day: wall.day, hour: wall.hour, minute: wall.minute },
    { zone },
  );
  if (!dt.isValid) throw new Error(`Invalid wall-clock/zone: ${dt.invalidReason}`);
  return dt.toUTC().toISO()!;
}

/** UTC ISO → wall-clock components in a zone. */
export function toWallClock(utcIso: string, zone: string): WallClock {
  const dt = zonedDateTime(utcIso, zone);
  return { year: dt.year, month: dt.month, day: dt.day, hour: dt.hour, minute: dt.minute };
}

/** Calendar day key ('yyyy-MM-dd') for a UTC instant in a zone — for day grouping. */
export function calendarDayKey(utcIso: string, zone: string): string {
  return zonedDateTime(utcIso, zone).toFormat('yyyy-MM-dd');
}

/** Add minutes to a UTC ISO instant, returning UTC ISO. */
export function addMinutesUtc(utcIso: string, minutes: number): string {
  return DateTime.fromISO(utcIso, { zone: 'utc' }).plus({ minutes }).toISO()!;
}

/** Minutes between two UTC ISO instants (b - a). */
export function diffMinutes(aUtcIso: string, bUtcIso: string): number {
  const a = DateTime.fromISO(aUtcIso, { zone: 'utc' });
  const b = DateTime.fromISO(bUtcIso, { zone: 'utc' });
  return Math.round(b.diff(a, 'minutes').minutes);
}

/** The device's IANA zone (e.g. 'Europe/Paris'), used as the onboarding default. */
export function deviceTimeZone(): string {
  return DateTime.local().zoneName ?? 'UTC';
}

/**
 * Q-ARCH-3 guard: verify the runtime resolves IANA zone data correctly before we
 * rely on it for scheduling. Returns the zones that failed to produce the expected
 * UTC offset (empty array = all good). Run on-device in Phase 0.
 */
export function verifyTimeZoneData(
  zones: string[] = ['Europe/Paris', 'America/New_York', 'Asia/Tokyo', 'Australia/Sydney'],
): string[] {
  return zones.filter((zone) => {
    const dt = DateTime.fromObject({ year: 2026, month: 1, day: 15, hour: 12 }, { zone });
    return !dt.isValid || dt.zoneName !== zone;
  });
}
