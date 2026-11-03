import { describe, expect, it } from '@jest/globals';
import type { TimeBlock } from '@/entities/time-block';
import {
  blockDays,
  dayOffRecord,
  daysInRange,
  draftOfBlock,
  EMPTY_DRAFT,
  pickRange,
  rangeLabel,
} from './day-off';

const ZONE = 'Asia/Bishkek';
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

describe('pickRange', () => {
  const empty = { start: '', end: '' };
  it('starts on the first day, ends on a later one', () => {
    const one = pickRange(empty, '2026-12-22', true);
    expect(one).toEqual({ start: '2026-12-22', end: '2026-12-22' });
    expect(pickRange(one, '2026-12-29', true)).toEqual({ start: '2026-12-22', end: '2026-12-29' });
  });
  it('starts over on an earlier day and after a full range', () => {
    const one = { start: '2026-12-22', end: '2026-12-22' };
    expect(pickRange(one, '2026-12-20', true)).toEqual({ start: '2026-12-20', end: '2026-12-20' });
    const full = { start: '2026-12-22', end: '2026-12-29' };
    expect(pickRange(full, '2026-12-25', true)).toEqual({ start: '2026-12-25', end: '2026-12-25' });
  });
  it('keeps one day for a part of a day', () => {
    const one = { start: '2026-12-22', end: '2026-12-22' };
    expect(pickRange(one, '2026-12-29', false)).toEqual({ start: '2026-12-29', end: '2026-12-29' });
  });
});

describe('dayOffRecord', () => {
  it('waits for a day', () => {
    expect(dayOffRecord(EMPTY_DRAFT, ZONE)).toBeNull();
  });
  it('takes whole days in the master’s zone, the end exclusive', () => {
    const record = dayOffRecord(
      { ...EMPTY_DRAFT, kind: 'vacation', start: '2026-12-22', end: '2026-12-29', note: ' дом ' },
      ZONE,
    );
    expect(record).toMatchObject({
      kind: 'vacation',
      all_day: true,
      close_online: true,
      notes: 'дом',
    });
    expect(new Date(record!.start_at).toISOString()).toBe('2026-12-21T18:00:00.000Z');
    expect(new Date(record!.end_at).toISOString()).toBe('2026-12-29T18:00:00.000Z');
  });
  it('takes a part of the day, refuses one that ends before it starts', () => {
    const part = { ...EMPTY_DRAFT, start: '2026-12-22', end: '2026-12-22', allDay: false };
    const record = dayOffRecord(part, ZONE);
    expect(new Date(record!.start_at).toISOString()).toBe('2026-12-22T04:00:00.000Z');
    expect(new Date(record!.end_at).toISOString()).toBe('2026-12-22T08:00:00.000Z');
    expect(dayOffRecord({ ...part, fromTime: '15:00' }, ZONE)).toBeNull();
  });
});

describe('a block back in the sheet', () => {
  const block = {
    start_at: '2026-12-21T18:00:00+00:00',
    end_at: '2026-12-29T18:00:00+00:00',
    all_day: true,
    kind: 'vacation',
    close_online: false,
    notes: 'дом',
  } as TimeBlock;

  it('reads the last day from the exclusive end', () => {
    expect(blockDays(block, ZONE)).toEqual({ first: '2026-12-22', last: '2026-12-29' });
  });
  it('round-trips', () => {
    const draft = draftOfBlock(block, ZONE);
    expect(draft).toMatchObject({ kind: 'vacation', closeOnline: false, note: 'дом' });
    const record = dayOffRecord(draft, ZONE)!;
    expect(new Date(record.start_at).getTime()).toBe(new Date(block.start_at).getTime());
    expect(new Date(record.end_at).getTime()).toBe(new Date(block.end_at).getTime());
  });
});

describe('labels', () => {
  it('counts both ends', () => {
    expect(daysInRange('2026-12-22', '2026-12-29')).toBe(8);
    expect(daysInRange('2026-12-22', '2026-12-22')).toBe(1);
  });
  it('reads as in the design', () => {
    expect(rangeLabel('2026-12-22', '2026-12-29', MONTHS)).toBe('22 – 29 декабря');
    expect(rangeLabel('2027-01-01', '2027-01-01', MONTHS)).toBe('1 января');
    expect(rangeLabel('2026-12-28', '2027-01-02', MONTHS)).toBe('28 декабря – 2 января');
  });
});
