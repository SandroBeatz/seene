import { describe, expect, it } from '@jest/globals';
import {
  copyMondayToWeekdays,
  DEFAULT_HOURS,
  dayRuns,
  expandSame,
  hasInvalidRange,
  nextBreak,
  sameSummary,
  toWeek,
  workingDayCount,
} from './hours';

const SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

describe('working hours', () => {
  it('defaults to Mon–Sat 10–19 with lunch', () => {
    expect(sameSummary(DEFAULT_HOURS, SHORT)).toBe('Пн–Сб, 10–19');
    expect(workingDayCount(DEFAULT_HOURS)).toBe(6);
    expect(toWeek(DEFAULT_HOURS)[0]).toEqual({
      enabled: true,
      start: '10:00',
      end: '19:00',
      breaks: [{ start: '13:00', end: '14:00' }],
    });
  });

  it('reads the per-day schedule in "По дням" mode', () => {
    const perDay = expandSame(DEFAULT_HOURS.same).map((d, i) => (i === 5 ? { ...d, start: '11:00' } : d));
    const hours = { ...DEFAULT_HOURS, mode: 'days' as const, perDay };
    expect(toWeek(hours)[5]!.start).toBe('11:00');
    expect(sameSummary(hours, SHORT)).toBeNull();
  });

  it('names day runs like the design', () => {
    expect(dayRuns([true, true, true, false, true, false, false], SHORT)).toBe('Пн–Ср, Пт');
    expect(dayRuns([true, true, false, false, false, true, true], SHORT)).toBe('Пн, Вт, Сб, Вс');
    expect(dayRuns([false, false, false, false, false, false, false], SHORT)).toBe('');
  });

  it('suggests lunch, then a 30-min break 2 h after the last', () => {
    expect(nextBreak([])).toEqual({ start: '13:00', end: '14:00' });
    expect(nextBreak([{ start: '13:00', end: '14:00' }])).toEqual({ start: '16:00', end: '16:30' });
  });

  it('flags days or breaks that end before they start', () => {
    expect(hasInvalidRange(DEFAULT_HOURS)).toBe(false);
    const late = { ...DEFAULT_HOURS, same: { ...DEFAULT_HOURS.same, start: '19:00', end: '10:00' } };
    expect(hasInvalidRange(late)).toBe(true);
    const badBreak = { ...DEFAULT_HOURS, same: { ...DEFAULT_HOURS.same, breaks: [{ start: '14:00', end: '13:00' }] } };
    expect(hasInvalidRange(badBreak)).toBe(true);
  });

  it('copies Monday onto Tue–Fri only', () => {
    const days = expandSame(DEFAULT_HOURS.same).map((d, i) => ({ ...d, start: `0${i}:00` }));
    const copied = copyMondayToWeekdays(days);
    expect(copied.slice(1, 5).every((d) => d.start === '00:00')).toBe(true);
    expect(copied[5]!.start).toBe('05:00');
  });
});
