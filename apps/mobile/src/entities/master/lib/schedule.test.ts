import { describe, expect, it } from '@jest/globals';
import type { DaySchedule, WeeklySchedule } from '../model/types';
import { toStoredSchedule } from './schedule';

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
