import { describe, expect, it } from '@jest/globals';
import { seenOf } from './seen';

const ZONE = 'Asia/Bishkek';
const NOW = new Date('2026-10-30T08:00:00.000Z').getTime(); // 14:00 in Bishkek
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();
const summary = (lastVisit: string | null, nextVisit: string | null = null) => ({ lastVisit, nextVisit });

describe('seenOf', () => {
  it('shows the time when the client comes today', () => {
    expect(seenOf(summary(daysAgo(20), '2026-10-30T10:00:00.000Z'), NOW, ZONE)).toEqual({
      kind: 'todayAt',
      at: '2026-10-30T10:00:00.000Z',
    });
  });

  it('counts calendar days in the master zone', () => {
    // 23:30 yesterday in Bishkek is still "yesterday", not "today".
    expect(seenOf(summary('2026-10-29T17:30:00.000Z'), NOW, ZONE)).toEqual({ kind: 'yesterday' });
    expect(seenOf(summary('2026-10-30T02:00:00.000Z'), NOW, ZONE)).toEqual({ kind: 'today' });
  });

  it('rounds into days, weeks and months', () => {
    expect(seenOf(summary(daysAgo(5)), NOW, ZONE)).toEqual({ kind: 'days', count: 5 });
    expect(seenOf(summary(daysAgo(49)), NOW, ZONE)).toEqual({ kind: 'weeks', count: 7 });
    expect(seenOf(summary(daysAgo(95)), NOW, ZONE)).toEqual({ kind: 'months', count: 3 });
  });

  it('falls back to the first booking, then to never', () => {
    expect(seenOf(summary(null, '2026-11-05T06:00:00.000Z'), NOW, ZONE)).toEqual({
      kind: 'booked',
      at: '2026-11-05T06:00:00.000Z',
    });
    expect(seenOf(undefined, NOW, ZONE)).toEqual({ kind: 'never' });
  });
});
