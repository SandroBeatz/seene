import { describe, expect, it } from '@jest/globals';
import {
  addMinutesUtc,
  calendarDayKey,
  diffMinutes,
  toUtcIsoFromWallClock,
  toWallClock,
  verifyTimeZoneData,
  zonedDateTime,
} from './index';

describe('time-zone core', () => {
  it('round-trips wall-clock ↔ UTC in a DST zone (summer)', () => {
    // 14:30 on 2026-08-19 in Paris is UTC+2 → 12:30 UTC
    const utc = toUtcIsoFromWallClock(
      { year: 2026, month: 8, day: 19, hour: 14, minute: 30 },
      'Europe/Paris',
    );
    expect(utc).toBe('2026-08-19T12:30:00.000Z');
    const wall = toWallClock(utc, 'Europe/Paris');
    expect(wall).toEqual({ year: 2026, month: 8, day: 19, hour: 14, minute: 30 });
  });

  it('applies the correct offset in winter (no DST)', () => {
    // 14:30 on 2026-01-15 in Paris is UTC+1 → 13:30 UTC
    const utc = toUtcIsoFromWallClock(
      { year: 2026, month: 1, day: 15, hour: 14, minute: 30 },
      'Europe/Paris',
    );
    expect(utc).toBe('2026-01-15T13:30:00.000Z');
  });

  it('derives the calendar day key in the target zone, not UTC', () => {
    // 23:30 Tokyo (UTC+9) on the 19th is 14:30 UTC same day; but 06:30 UTC on 20th
    // in Tokyo is the 20th while still the 20th... check the cross-midnight case:
    const utc = toUtcIsoFromWallClock(
      { year: 2026, month: 8, day: 19, hour: 0, minute: 30 },
      'Asia/Tokyo',
    );
    // 00:30 Tokyo 19th → 15:30 UTC 18th, but day key in Tokyo must be the 19th.
    expect(utc).toBe('2026-08-18T15:30:00.000Z');
    expect(calendarDayKey(utc, 'Asia/Tokyo')).toBe('2026-08-19');
    expect(calendarDayKey(utc, 'utc')).toBe('2026-08-18');
  });

  it('adds minutes and diffs across the UTC line', () => {
    const start = '2026-08-19T12:30:00.000Z';
    const end = addMinutesUtc(start, 90);
    expect(end).toBe('2026-08-19T14:00:00.000Z');
    expect(diffMinutes(start, end)).toBe(90);
  });

  it('produces a valid zoned DateTime', () => {
    const dt = zonedDateTime('2026-08-19T12:30:00.000Z', 'America/New_York');
    expect(dt.isValid).toBe(true);
    expect(dt.hour).toBe(8); // UTC-4 in August
  });

  it('verifyTimeZoneData reports no failures for common zones', () => {
    expect(verifyTimeZoneData()).toEqual([]);
  });
});
