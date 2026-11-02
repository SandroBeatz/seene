import { describe, expect, it } from '@jest/globals';
import {
  cellBars,
  daysOfMonth,
  freeCells,
  groupByDay,
  monthBounds,
  monthRange,
  monthRows,
  timelineStamp,
  unavailableHours,
  withNeighbours,
  workMinutes,
} from './calendar';

const BISHKEK = 'Asia/Bishkek'; // UTC+6, no DST
const workday = (start: string, end: string, breaks: { start: string; end: string }[] = []) => ({
  enabled: true,
  start,
  end,
  breaks,
});

describe('months', () => {
  it('lists months around the center across a year', () => {
    expect(monthRange('2026-12', 1, 1)).toEqual(['2026-11', '2026-12', '2027-01']);
  });

  it('counts Monday-first weeks', () => {
    expect(monthRows('2026-11')).toBe(6); // starts on Sunday
    expect(monthRows('2026-10')).toBe(5); // starts on Thursday
    expect(monthRows('2027-02')).toBe(4); // 28 days from a Monday
  });

  it('lists a month’s days', () => {
    const days = daysOfMonth('2028-02');
    expect(days).toHaveLength(29);
    expect(days[28]).toBe('2028-02-29');
  });

  it('bounds a month in the master’s zone', () => {
    expect(monthBounds('2026-11', BISHKEK)).toEqual({
      start: '2026-10-31T18:00:00.000Z',
      end: '2026-11-30T18:00:00.000Z',
    });
  });

  it('adds neighbours once, in order', () => {
    expect(withNeighbours(['2026-11', '2026-12'])).toEqual([
      '2026-10',
      '2026-11',
      '2026-12',
      '2027-01',
    ]);
  });
});

describe('groupByDay', () => {
  const visit = (id: string, start_at: string, duration: number) => ({
    value: id,
    id,
    start_at,
    duration,
  });

  it('files a visit under the master’s local day', () => {
    const index = groupByDay({
      zone: BISHKEK,
      visits: [visit('late', '2026-11-01T19:00:00.000Z', 60)],
      blocks: [],
    });
    expect(index.get('2026-11-02')?.[0]).toMatchObject({ from: 60, to: 120 });
    expect(index.has('2026-11-01')).toBe(false);
  });

  it('clips a visit running past midnight', () => {
    const index = groupByDay({
      zone: BISHKEK,
      visits: [visit('night', '2026-11-02T17:30:00.000Z', 60)],
      blocks: [],
    });
    expect(index.get('2026-11-02')?.[0]).toMatchObject({ from: 23 * 60 + 30, to: 24 * 60 });
    expect(index.has('2026-11-03')).toBe(false);
  });

  it('puts personal time on every day it touches', () => {
    const index = groupByDay({
      zone: BISHKEK,
      visits: [],
      blocks: [
        {
          value: 'trip',
          id: 'trip',
          start_at: '2026-11-02T16:00:00.000Z', // 22:00
          end_at: '2026-11-04T06:00:00.000Z', // 12:00, two days on
          all_day: false,
        },
      ],
    });
    expect(index.get('2026-11-02')?.[0]).toMatchObject({ from: 22 * 60, to: 24 * 60 });
    expect(index.get('2026-11-03')?.[0]).toMatchObject({ from: 0, to: 24 * 60 });
    expect(index.get('2026-11-04')?.[0]).toMatchObject({ from: 0, to: 12 * 60 });
    expect(index.size).toBe(3);
  });

  it('does not spill personal time ending at midnight into the next day', () => {
    const index = groupByDay({
      zone: BISHKEK,
      visits: [],
      blocks: [
        {
          value: 'day',
          id: 'day',
          start_at: '2026-11-01T18:00:00.000Z', // midnight on the 2nd
          end_at: '2026-11-02T18:00:00.000Z', // midnight on the 3rd
          all_day: true,
        },
      ],
    });
    expect(index.get('2026-11-02')?.[0]).toMatchObject({ from: 0, to: 24 * 60, allDay: true });
    expect(index.has('2026-11-03')).toBe(false);
  });

  it('sorts a day by start', () => {
    const index = groupByDay({
      zone: BISHKEK,
      visits: [
        visit('b', '2026-11-02T08:00:00.000Z', 30),
        visit('a', '2026-11-02T04:00:00.000Z', 30),
      ],
      blocks: [],
    });
    expect(index.get('2026-11-02')?.map((e) => e.id)).toEqual(['a', 'b']);
  });
});

describe('cellBars', () => {
  it('shows up to three', () => {
    expect(cellBars([1, 2, 3])).toEqual({ shown: [1, 2, 3], more: 0 });
  });
  it('shows two and the rest as a count', () => {
    expect(cellBars([1, 2, 3, 4, 5])).toEqual({ shown: [1, 2], more: 3 });
  });
});

describe('freeCells', () => {
  const work: [number, number] = [600, 720]; // 10:00–12:00

  it('lists the half hours of a free working day', () => {
    expect(freeCells({ work, busy: [], after: 0 })).toEqual([600, 630, 660, 690]);
  });

  it('skips a cell a record touches at all', () => {
    expect(freeCells({ work, busy: [[615, 640]], after: 0 })).toEqual([660, 690]);
  });

  it('keeps cells right next to a record', () => {
    expect(freeCells({ work, busy: [[630, 660]], after: 0 })).toEqual([600, 660, 690]);
  });

  it('starts after now, on the next line', () => {
    expect(freeCells({ work, busy: [], after: 620 })).toEqual([630, 660, 690]);
  });

  it('keeps to the grid and the working day when hours are off it', () => {
    expect(freeCells({ work: [615, 705], busy: [], after: 0 })).toEqual([630, 660]);
  });
});

describe('work hours', () => {
  it('reads a day off and a broken schedule as no work', () => {
    expect(workMinutes({ ...workday('10:00', '19:00'), enabled: false })).toBeNull();
    expect(workMinutes(workday('19:00', '10:00'))).toBeNull();
    expect(workMinutes(null)).toBeNull();
  });

  it('shades outside hours and breaks', () => {
    expect(unavailableHours(workday('10:00', '19:30', [{ start: '13:00', end: '13:30' }]))).toEqual(
      [
        { start: 0, end: 10 },
        { start: 19.5, end: 24 },
        { start: 13, end: 13.5 },
      ],
    );
  });

  it('shades a whole day off', () => {
    expect(unavailableHours(null)).toEqual([{ start: 0, end: 24 }]);
  });
});

describe('timelineStamp', () => {
  it('formats minutes on the wall clock', () => {
    expect(timelineStamp('2026-11-02', 605)).toBe('2026-11-02 10:05:00');
  });
  it('keeps midnight in the day', () => {
    expect(timelineStamp('2026-11-02', 1440)).toBe('2026-11-02 23:59:59');
  });
});
