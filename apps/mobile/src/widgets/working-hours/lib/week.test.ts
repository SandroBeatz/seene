import { describe, expect, it } from '@jest/globals';
import type { DaySchedule } from '@/entities/master';
import { isDayValid, setDayEnabled, withDay } from './week';

const day = (patch: Partial<DaySchedule> = {}): DaySchedule => ({
  enabled: true,
  start: '10:00',
  end: '19:00',
  breaks: [],
  ...patch,
});

describe('isDayValid', () => {
  it('needs the end after the start', () => {
    expect(isDayValid(day({ end: '10:00' }))).toBe(false);
  });
  it('needs breaks inside the day', () => {
    expect(isDayValid(day({ breaks: [{ start: '13:00', end: '14:00' }] }))).toBe(true);
    expect(isDayValid(day({ breaks: [{ start: '18:30', end: '19:30' }] }))).toBe(false);
    expect(isDayValid(day({ breaks: [{ start: '14:00', end: '13:00' }] }))).toBe(false);
  });
  it('does not judge a day off', () => {
    expect(isDayValid(day({ enabled: false, start: '00:00', end: '00:00' }))).toBe(true);
  });
});

describe('setDayEnabled', () => {
  it('gives a never-set day real hours', () => {
    const next = setDayEnabled(day({ enabled: false, start: '00:00', end: '00:00' }), true);
    expect(next).toMatchObject({ enabled: true, start: '10:00', end: '19:00' });
  });
  it('keeps the hours of a day switched off and on', () => {
    expect(setDayEnabled(day({ enabled: false, start: '11:00' }), true).start).toBe('11:00');
    expect(setDayEnabled(day({ start: '11:00' }), false).start).toBe('11:00');
  });
});

describe('withDay', () => {
  const week = Array.from({ length: 7 }, () => day());
  const monday = day({ start: '09:00' });

  it('replaces only that day', () => {
    const next = withDay(week, 0, monday);
    expect(next.map((d) => d.start)).toEqual(['09:00', ...Array(6).fill('10:00')]);
  });
  it('passes Monday on to Tue–Fri, not the weekend', () => {
    const next = withDay(week, 0, monday, true);
    expect(next.map((d) => d.start)).toEqual([
      ...Array(5).fill('09:00'),
      '10:00',
      '10:00',
    ]);
  });
});
