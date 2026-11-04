import { describe, expect, it } from '@jest/globals';
import { categoryOf, feedDay, groupByDay, shortName } from './feed';

const ZONE = 'Asia/Bishkek';
// 12:00 in Bishkek.
const NOW = Date.parse('2026-11-04T06:00:00Z');

describe('feedDay', () => {
  it('names today in the master zone, not in UTC', () => {
    expect(feedDay('2026-11-03T19:00:00Z', ZONE, NOW)).toBe('today');
  });

  it('names yesterday', () => {
    expect(feedDay('2026-11-03T10:00:00Z', ZONE, NOW)).toBe('yesterday');
  });

  it('puts the rest under earlier', () => {
    expect(feedDay('2026-10-30T10:00:00Z', ZONE, NOW)).toBe('earlier');
  });
});

describe('groupByDay', () => {
  it('keeps the order and splits by day', () => {
    const groups = groupByDay(
      [
        { created_at: '2026-11-04T05:00:00Z' },
        { created_at: '2026-11-04T04:00:00Z' },
        { created_at: '2026-11-03T10:00:00Z' },
      ],
      ZONE,
      NOW,
    );
    expect(groups.map((g) => [g.day, g.rows.length])).toEqual([
      ['today', 2],
      ['yesterday', 1],
    ]);
  });
});

describe('shortName', () => {
  it('shortens the last name', () => {
    expect(shortName('Айгерим Касымова')).toBe('Айгерим К.');
  });

  it('keeps a single name', () => {
    expect(shortName('Света')).toBe('Света');
  });

  it('copes with no name', () => {
    expect(shortName(null)).toBe('');
  });
});

describe('categoryOf', () => {
  it('files a booking under visits', () => {
    expect(categoryOf({ kind: 'booking_moved' })).toBe('visits');
  });
});
