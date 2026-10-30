import { describe, expect, it } from '@jest/globals';
import type { DaySchedule, WeeklySchedule } from '../model/types';
import { parseStoredSchedule, scheduleForWeekday, toStoredSchedule } from './schedule';

const day = (start: string, enabled = true): DaySchedule => ({
  enabled,
  start,
  end: '19:00',
  breaks: [],
});

describe('toStoredSchedule', () => {
  it('keys the Monday-first week by weekday and keeps the timezone', () => {
    const week: WeeklySchedule = [
      day('09:00'),
      day('10:00'),
      day('10:00'),
      day('10:00'),
      day('10:00'),
      day('11:00'),
      day('10:00', false),
    ];
    const stored = toStoredSchedule(week, 'Asia/Bishkek');
    expect(stored.timezone).toBe('Asia/Bishkek');
    expect(stored.days.monday.start).toBe('09:00');
    expect(stored.days.saturday.start).toBe('11:00');
    expect(stored.days.sunday.enabled).toBe(false);
  });
});

describe('parseStoredSchedule', () => {
  it('reads the stored shape and picks a weekday Monday-first', () => {
    const json = {
      timezone: 'Asia/Bishkek',
      days: {
        tuesday: {
          enabled: true,
          start: '10:00',
          end: '19:00',
          breaks: [{ start: '13:00', end: '14:00' }],
        },
      },
    };
    const schedule = parseStoredSchedule(json)!;
    expect(schedule.timezone).toBe('Asia/Bishkek');
    expect(scheduleForWeekday(schedule, 1)).toEqual(json.days.tuesday);
    // Missing days read as days off.
    expect(scheduleForWeekday(schedule, 0).enabled).toBe(false);
  });

  it('drops malformed breaks and rejects malformed schedules', () => {
    const schedule = parseStoredSchedule({
      timezone: 'UTC',
      days: {
        monday: { enabled: true, start: '09:00', end: '18:00', breaks: [{ start: 1 }, 'x'] },
      },
    })!;
    expect(schedule.days.monday.breaks).toEqual([]);
    expect(parseStoredSchedule(null)).toBeNull();
    expect(parseStoredSchedule({ days: {} })).toBeNull();
    expect(parseStoredSchedule([1, 2])).toBeNull();
  });
});
