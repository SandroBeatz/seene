import { describe, expect, it } from '@jest/globals';
import {
  canStepForward,
  currentPeriod,
  customPeriod,
  periodDays,
  periodRange,
  shiftPeriod,
  stepPeriod,
} from './period';

const ZONE = 'Asia/Bishkek';

describe('currentPeriod', () => {
  it('starts a week on Monday', () => {
    expect(currentPeriod('week', '2026-11-02', ZONE)).toEqual({
      unit: 'week',
      startKey: '2026-11-02',
      endKey: '2026-11-08',
    });
    expect(currentPeriod('week', '2026-11-01', ZONE).startKey).toBe('2026-10-26');
  });

  it('covers the whole month and year', () => {
    expect(currentPeriod('month', '2026-02-10', ZONE).endKey).toBe('2026-02-28');
    expect(currentPeriod('year', '2026-02-10', ZONE)).toMatchObject({
      startKey: '2026-01-01',
      endKey: '2026-12-31',
    });
  });
});

describe('shiftPeriod', () => {
  it('keeps whole months of different lengths', () => {
    const march = currentPeriod('month', '2026-03-15', ZONE);
    expect(shiftPeriod(march, -1, ZONE)).toMatchObject({
      startKey: '2026-02-01',
      endKey: '2026-02-28',
    });
  });

  it('moves a custom period by its own length', () => {
    expect(shiftPeriod(customPeriod('2026-10-05', '2026-10-18'), -1, ZONE)).toEqual({
      unit: 'custom',
      startKey: '2026-09-21',
      endKey: '2026-10-04',
    });
  });
});

describe('canStepForward', () => {
  it('stops at the period holding today', () => {
    expect(canStepForward(currentPeriod('month', '2026-11-02', ZONE), '2026-11-02')).toBe(false);
    expect(canStepForward(currentPeriod('month', '2026-10-02', ZONE), '2026-11-02')).toBe(true);
  });
});

describe('stepPeriod', () => {
  const custom = { unit: 'custom' as const, startKey: '2026-11-01', endKey: '2026-11-10' };

  it('stops a custom period at today', () => {
    expect(stepPeriod(custom, 1, '2026-11-12', ZONE)).toEqual({
      unit: 'custom',
      startKey: '2026-11-11',
      endKey: '2026-11-12',
    });
  });

  it('keeps the length when the whole step is in the past', () => {
    expect(stepPeriod(custom, 1, '2026-12-01', ZONE).endKey).toBe('2026-11-20');
    expect(stepPeriod(custom, -1, '2026-11-12', ZONE).endKey).toBe('2026-10-31');
  });
});

describe('periodRange', () => {
  it('uses the zone for the boundaries', () => {
    const range = periodRange(currentPeriod('month', '2026-10-15', ZONE), '2026-11-02', ZONE);
    expect(range.from).toBe('2026-09-30T18:00:00.000Z');
    expect(range.to).toBe('2026-10-31T18:00:00.000Z');
    expect(range.granularity).toBe('day');
  });

  it('compares a finished period with the whole previous one', () => {
    const range = periodRange(currentPeriod('month', '2026-10-15', ZONE), '2026-11-02', ZONE);
    expect(range.prevFrom).toBe('2026-08-31T18:00:00.000Z');
    expect(range.prevTo).toBe('2026-09-30T18:00:00.000Z');
  });

  it('compares a running period with the same days of the previous one', () => {
    const range = periodRange(currentPeriod('month', '2026-11-02', ZONE), '2026-11-02', ZONE);
    expect(range.prevFrom).toBe('2026-09-30T18:00:00.000Z');
    expect(range.prevTo).toBe('2026-10-02T18:00:00.000Z');
  });

  it('goes by month for a year and a long custom period', () => {
    expect(periodRange(currentPeriod('year', '2026-11-02', ZONE), '2026-11-02', ZONE).granularity).toBe(
      'month',
    );
    const long = customPeriod('2026-01-01', '2026-06-30');
    expect(periodDays(long)).toBe(181);
    expect(periodRange(long, '2026-11-02', ZONE).granularity).toBe('month');
    expect(periodRange(customPeriod('2026-10-05', '2026-10-18'), '2026-11-02', ZONE).granularity).toBe(
      'day',
    );
  });
});
