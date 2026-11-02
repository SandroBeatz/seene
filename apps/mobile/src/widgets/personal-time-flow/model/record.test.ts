import { describe, expect, it } from '@jest/globals';
import type { TimeBlock } from '@/entities/time-block';
import { draftOfBlock, personalTimeRecord, staysInPlace } from './record';

const ZONE = 'Asia/Bishkek'; // UTC+6
const base = { start: null, allDay: false, length: 60, spanDays: 1, title: '' };

describe('personalTimeRecord', () => {
  it('is null until a start is chosen', () => {
    expect(personalTimeRecord(base, '2026-11-02', ZONE)).toBeNull();
  });

  it('spans the start plus the length, with the trimmed name', () => {
    expect(
      personalTimeRecord(
        { ...base, start: '2026-11-02T07:00:00.000Z', length: 90, title: '  Обед ' },
        '2026-11-02',
        ZONE,
      ),
    ).toEqual({
      start_at: '2026-11-02T07:00:00.000Z',
      end_at: '2026-11-02T08:30:00.000Z',
      all_day: false,
      notes: 'Обед',
    });
  });

  it('covers the local day when it is the whole day, without a name', () => {
    expect(
      personalTimeRecord(
        { ...base, allDay: true, start: '2026-11-02T07:00:00.000Z', title: ' ' },
        '2026-11-02',
        ZONE,
      ),
    ).toEqual({
      start_at: '2026-11-01T18:00:00.000Z',
      end_at: '2026-11-02T18:00:00.000Z',
      all_day: true,
      notes: null,
    });
  });
});

const lunch: TimeBlock = {
  id: 'b',
  user_id: 'u',
  start_at: '2026-11-02T07:00:00+00:00',
  end_at: '2026-11-02T08:30:00+00:00',
  all_day: false,
  notes: 'Обед',
} as TimeBlock;

describe('draftOfBlock', () => {
  it("takes the block's day in the master's zone, its length and name", () => {
    expect(
      draftOfBlock(
        { ...lunch, start_at: '2026-11-02T20:00:00Z', end_at: '2026-11-02T21:00:00Z' },
        ZONE,
      ),
    ).toEqual({
      dayKey: '2026-11-03',
      allDay: false,
      length: 60,
      spanDays: 1,
      title: 'Обед',
    });
  });

  it('keeps a usable length for an all-day block, an empty name for none', () => {
    const allDay = { ...lunch, all_day: true, notes: null, end_at: '2026-11-03T07:00:00Z' };
    expect(draftOfBlock(allDay, ZONE)).toMatchObject({ allDay: true, length: 60, title: '' });
  });
});

describe('moving a multi-day all-day block', () => {
  // 3 days in Bishkek: Nov 2 00:00 .. Nov 5 00:00 local.
  const vacation = {
    ...lunch,
    all_day: true,
    start_at: '2026-11-01T18:00:00Z',
    end_at: '2026-11-04T18:00:00Z',
  };

  it('reads its span', () => {
    expect(draftOfBlock(vacation, ZONE)).toMatchObject({ dayKey: '2026-11-02', spanDays: 3 });
  });

  it('keeps the span on the new day', () => {
    expect(
      personalTimeRecord({ ...base, allDay: true, spanDays: 3 }, '2026-11-10', ZONE),
    ).toMatchObject({
      start_at: '2026-11-09T18:00:00.000Z',
      end_at: '2026-11-12T18:00:00.000Z',
      all_day: true,
    });
  });

  it('stays in place on its own day', () => {
    const record = personalTimeRecord({ ...base, allDay: true, spanDays: 3 }, '2026-11-02', ZONE)!;
    expect(staysInPlace(vacation, record)).toBe(true);
  });
});

describe('staysInPlace', () => {
  const record = {
    start_at: '2026-11-02T07:00:00.000Z',
    end_at: '2026-11-02T08:30:00.000Z',
    all_day: false,
  };

  it('compares instants, not their spelling', () => {
    expect(staysInPlace(lunch, record)).toBe(true);
  });

  it('sees another start, length or all-day', () => {
    expect(staysInPlace(lunch, { ...record, start_at: '2026-11-02T06:00:00.000Z' })).toBe(false);
    expect(staysInPlace(lunch, { ...record, end_at: '2026-11-02T09:00:00.000Z' })).toBe(false);
    expect(staysInPlace(lunch, { ...record, all_day: true })).toBe(false);
  });
});
