import { describe, expect, it } from '@jest/globals';
import {
  buildDayTimeline,
  dayBounds,
  findFreeSlots,
  groupByDayPart,
  weekdayIndex,
  workingHours,
  type WorkdayHours,
} from './index';

const ZONE = 'Asia/Bishkek'; // UTC+6, no DST
const DAY = '2026-10-27'; // Tuesday

/** Wall-clock "HH:mm" on DAY in Bishkek → UTC ISO. */
const local = (hhmm: string, day = DAY) => {
  const [h, m] = hhmm.split(':').map(Number);
  const [y, mo, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h - 6, m)).toISOString();
};
const nowAt = (hhmm: string, day = DAY) => new Date(local(hhmm, day)).getTime();

const WORKDAY: WorkdayHours = {
  enabled: true,
  start: '10:00',
  end: '19:00',
  breaks: [{ start: '13:00', end: '14:00' }],
};

const visit = (id: string, hhmm: string, duration: number, day = DAY) => ({
  id,
  start_at: local(hhmm, day),
  duration,
});
const block = (id: string, from: string, to: string, all_day = false) => ({
  id,
  start_at: from,
  end_at: to,
  all_day,
});

describe('dayBounds', () => {
  it('spans local midnight to midnight in UTC', () => {
    expect(dayBounds(DAY, ZONE)).toEqual({
      start: '2026-10-26T18:00:00.000Z',
      end: '2026-10-27T18:00:00.000Z',
    });
  });

  it('is 23 hours on a spring-forward day', () => {
    const { start, end } = dayBounds('2026-03-29', 'Europe/Paris');
    expect((new Date(end).getTime() - new Date(start).getTime()) / 3_600_000).toBe(23);
  });
});

describe('weekdayIndex', () => {
  it('is Monday-first', () => {
    expect(weekdayIndex('2026-10-26')).toBe(0);
    expect(weekdayIndex(DAY)).toBe(1);
    expect(weekdayIndex('2026-11-01')).toBe(6);
  });
});

describe('workingHours', () => {
  it('converts the working day to UTC', () => {
    expect(workingHours(DAY, ZONE, WORKDAY)).toEqual({
      start: local('10:00'),
      end: local('19:00'),
    });
  });

  it('is null on a day off', () => {
    expect(workingHours(DAY, ZONE, { ...WORKDAY, enabled: false })).toBeNull();
    expect(workingHours(DAY, ZONE, null)).toBeNull();
  });
});

describe('buildDayTimeline', () => {
  const kinds = (items: ReturnType<typeof buildDayTimeline>) =>
    items.map((i) =>
      i.kind === 'appointment' || i.kind === 'block' ? `${i.kind}:${i.record.id}` : i.kind,
    );

  it('reproduces the designed day: visits, break, now line under the ongoing visit, personal time', () => {
    const items = buildDayTimeline({
      dayKey: DAY,
      zone: ZONE,
      workday: WORKDAY,
      appointments: [
        visit('dinara', '16:00', 90),
        visit('maria', '10:00', 90),
        visit('alexey', '11:30', 60),
        visit('aigerim', '14:00', 90),
        visit('elena', '17:30', 30),
      ],
      blocks: [block('tennis', local('18:15'), local('19:30'))],
      now: nowAt('14:20'),
    });
    expect(kinds(items)).toEqual([
      'appointment:maria',
      'appointment:alexey',
      'break',
      'appointment:aigerim',
      'now',
      'appointment:dinara',
      'appointment:elena',
      'block:tennis',
    ]);
  });

  it('computes appointment ends from the duration', () => {
    const [item] = buildDayTimeline({
      dayKey: DAY,
      zone: ZONE,
      workday: null,
      appointments: [visit('a', '10:00', 90)],
      blocks: [],
      now: 0,
    });
    expect(item).toMatchObject({ kind: 'appointment', start: local('10:00'), end: local('11:30') });
  });

  it('skips the now line on another day', () => {
    const items = buildDayTimeline({
      dayKey: DAY,
      zone: ZONE,
      workday: WORKDAY,
      appointments: [],
      blocks: [],
      now: nowAt('12:00', '2026-10-28'),
    });
    expect(kinds(items)).toEqual(['break']);
  });

  it('puts the now line first before the day starts and last after it ends', () => {
    const input = {
      dayKey: DAY,
      zone: ZONE,
      workday: null,
      appointments: [visit('a', '10:00', 60)],
      blocks: [],
    };
    expect(kinds(buildDayTimeline({ ...input, now: nowAt('08:00') }))).toEqual([
      'now',
      'appointment:a',
    ]);
    expect(kinds(buildDayTimeline({ ...input, now: nowAt('22:00') }))).toEqual([
      'appointment:a',
      'now',
    ]);
  });

  it('has no breaks on a day off', () => {
    const items = buildDayTimeline({
      dayKey: DAY,
      zone: ZONE,
      workday: { ...WORKDAY, enabled: false },
      appointments: [],
      blocks: [],
      now: 0,
    });
    expect(items).toEqual([]);
  });

  it('keeps visits crossing midnight and drops other days', () => {
    const items = buildDayTimeline({
      dayKey: DAY,
      zone: ZONE,
      workday: null,
      appointments: [
        visit('late-yesterday', '23:30', 60, '2026-10-26'),
        visit('tomorrow', '10:00', 60, '2026-10-28'),
      ],
      blocks: [],
      now: 0,
    });
    expect(kinds(items)).toEqual(['appointment:late-yesterday']);
  });

  it('clips multi-day personal time to the day and lists all-day blocks first', () => {
    const items = buildDayTimeline({
      dayKey: DAY,
      zone: ZONE,
      workday: null,
      appointments: [visit('a', '09:00', 60)],
      blocks: [
        block('trip', local('12:00', '2026-10-26'), local('12:00', '2026-10-29')),
        block('vacation', local('00:00'), local('00:00', '2026-10-28'), true),
      ],
      now: 0,
    });
    expect(kinds(items)).toEqual(['block:vacation', 'block:trip', 'appointment:a']);
    expect(items[1]).toMatchObject({
      start: '2026-10-26T18:00:00.000Z',
      end: '2026-10-27T18:00:00.000Z',
    });
  });

  it('orders a break before a visit starting at the same minute', () => {
    const items = buildDayTimeline({
      dayKey: DAY,
      zone: ZONE,
      workday: WORKDAY,
      appointments: [visit('a', '13:00', 30)],
      blocks: [],
      now: 0,
    });
    expect(kinds(items)).toEqual(['break', 'appointment:a']);
  });
});

describe('findFreeSlots', () => {
  const input = {
    dayKey: DAY,
    zone: ZONE,
    workday: WORKDAY, // 10:00–19:00, break 13:00–14:00
    stepMinutes: 30,
    duration: 60,
    busy: [] as { start: string; end: string }[],
    now: 0,
  };
  const labels = (slots: string[]) =>
    slots.map((s) => {
      const d = new Date(new Date(s).getTime() + 6 * 3_600_000);
      return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    });

  it('fits the visit inside working hours around the break', () => {
    expect(labels(findFreeSlots(input))).toEqual([
      '10:00',
      '10:30',
      '11:00',
      '11:30',
      '12:00',
      '14:00',
      '14:30',
      '15:00',
      '15:30',
      '16:00',
      '16:30',
      '17:00',
      '17:30',
      '18:00',
    ]);
  });

  it('skips busy time and starts already passed', () => {
    const slots = labels(
      findFreeSlots({
        ...input,
        busy: [{ start: local('15:00'), end: local('16:30') }],
        now: nowAt('11:10'),
      }),
    );
    expect(slots).toEqual(['11:30', '12:00', '14:00', '16:30', '17:00', '17:30', '18:00']);
  });

  it('is empty on a day off or when the visit is longer than the day', () => {
    expect(findFreeSlots({ ...input, workday: { ...WORKDAY, enabled: false } })).toEqual([]);
    expect(findFreeSlots({ ...input, duration: 10 * 60 })).toEqual([]);
  });
});

describe('groupByDayPart', () => {
  it('splits morning, afternoon and evening by the local hour', () => {
    const groups = groupByDayPart(
      [local('10:00'), local('11:30'), local('14:00'), local('17:30')],
      ZONE,
    );
    expect(groups.map((g) => [g.part, g.slots.length])).toEqual([
      ['morning', 2],
      ['afternoon', 1],
      ['evening', 1],
    ]);
  });
});
