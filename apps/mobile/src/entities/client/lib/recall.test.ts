import { describe, expect, it } from '@jest/globals';
import { recallCandidates, recallState } from './recall';

const at = (iso: string) => new Date(iso).getTime();

describe('recallState', () => {
  const day = (n: number) => new Date(Date.UTC(2026, 0, 1) + n * 86_400_000).toISOString();
  const now = at(day(100));

  it('needs three past visits', () => {
    expect(recallState([day(10), day(31)], false, now)).toBeNull();
  });

  it('is due seven weeks after a three-week rhythm', () => {
    expect(recallState([day(9), day(30), day(51)], false, now)).toEqual({
      cadenceDays: 21,
      sinceDays: 49,
      due: true,
    });
  });

  it('waits until half a rhythm (at least a week) late', () => {
    // 21-day rhythm → due from 32 days since the last visit
    expect(recallState([day(26), day(47), day(68)], false, now)?.due).toBe(true);
    expect(recallState([day(27), day(48), day(69)], false, now)?.due).toBe(false);
  });

  it('is never due with a booking ahead, and ignores future visits', () => {
    expect(recallState([day(9), day(30), day(51)], true, now)?.due).toBe(false);
    expect(recallState([day(9), day(30), day(120)], false, now)).toBeNull();
  });
});

describe('recallCandidates', () => {
  const day = (n: number) => new Date(Date.UTC(2026, 0, 1) + n * 86_400_000).toISOString();
  const now = at(day(100));
  const done = (client_id: string, n: number) => ({ client_id, start_at: day(n), status: 'completed' });

  it('finds regulars who are late, skipping those already booked', () => {
    const history = [
      done('late', 9),
      done('late', 30),
      done('late', 51),
      done('booked', 9),
      done('booked', 30),
      done('booked', 51),
      { client_id: 'booked', start_at: day(105), status: 'confirmed' },
      done('new', 90),
    ];
    expect(recallCandidates(history, now)).toEqual([
      { clientId: 'late', cadenceDays: 21, sinceDays: 49 },
    ]);
  });
});
