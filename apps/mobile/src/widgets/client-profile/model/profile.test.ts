import { describe, expect, it, jest } from '@jest/globals';

// The entities construct the Supabase client at import — stub it.
jest.mock('@/shared/api/supabase', () => ({ supabase: {} }));

/* eslint-disable import/first -- must be imported after the mock is registered */
import type { ClientAppointment } from '@/entities/appointment';
import { clientSince, groupVisitsByDay, profileStats, visitAmount } from './profile';
/* eslint-enable import/first */

const DAY = 86_400_000;
const NOW = Date.parse('2026-10-30T08:00:00.000Z'); // 14:00 in Bishkek
const ago = (days: number) => new Date(NOW - days * DAY).toISOString();

const visit = (
  id: string,
  start_at: string,
  status: ClientAppointment['status'] = 'completed',
  paid: number | null = null,
  price: number | null = 1000,
) => ({ id, start_at, status, paid, price, duration: 60 }) as ClientAppointment;

describe('profileStats', () => {
  const priceOf = (a: ClientAppointment) => visitAmount(a, 500);

  it('counts finished visits, no-shows and money', () => {
    const stats = profileStats(
      [
        visit('a', ago(63), 'completed', 1200),
        visit('b', ago(42), 'completed', null, 900),
        visit('c', ago(21), 'completed', null, null),
        visit('d', ago(10), 'no_show'),
        visit('e', ago(5), 'cancelled'),
      ],
      priceOf,
      NOW,
    );
    expect(stats).toMatchObject({
      visits: 3,
      noShows: 1,
      cadenceDays: 21,
      total: 2600,
      averageCheck: 867,
      firstVisit: ago(63),
    });
    // Last visit 21 days ago + a 21-day rhythm → today.
    expect(stats.recallAt).toBe(new Date(NOW).toISOString());
  });

  it('has no recall date with a booking ahead or too few visits', () => {
    const booked = profileStats(
      [visit('a', ago(63)), visit('b', ago(42)), visit('c', ago(21)), visit('n', ago(-3), 'confirmed')],
      priceOf,
      NOW,
    );
    expect(booked.recallAt).toBeNull();
    expect(booked.cadenceDays).toBe(21);
    const fresh = profileStats([visit('a', ago(10))], priceOf, NOW);
    expect(fresh).toMatchObject({ cadenceDays: null, recallAt: null, averageCheck: 1000 });
    expect(profileStats([], priceOf, NOW)).toMatchObject({ visits: 0, averageCheck: 0, total: 0 });
  });
});

describe('clientSince', () => {
  it('takes the earlier of the card and the first visit', () => {
    expect(clientSince('2026-05-01T00:00:00Z', '2025-03-10T00:00:00Z')).toBe('2025-03-10T00:00:00Z');
    expect(clientSince('2026-05-01T00:00:00Z', null)).toBe('2026-05-01T00:00:00Z');
  });
});

describe('groupVisitsByDay', () => {
  it('groups by the master day, newest first, in time order within a day', () => {
    const days = groupVisitsByDay(
      [
        visit('morning', '2026-10-30T03:00:00.000Z'),
        visit('evening', '2026-10-30T12:00:00.000Z'),
        // 23:30 on the 29th in Bishkek.
        visit('late', '2026-10-29T17:30:00.000Z'),
      ],
      'Asia/Bishkek',
      NOW,
    );
    expect(days.map((d) => [d.dayKey, d.isToday, d.visits.map((v) => v.id)])).toEqual([
      ['2026-10-30', true, ['morning', 'evening']],
      ['2026-10-29', false, ['late']],
    ]);
  });
});
