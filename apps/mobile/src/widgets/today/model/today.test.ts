import { describe, expect, it, jest } from '@jest/globals';
import type { AppointmentSource, AppointmentStatus } from '@/entities/appointment';

// The appointment entity's api constructs the Supabase client at import — stub it.
jest.mock('@/shared/api/supabase', () => ({ supabase: {} }));

/* eslint-disable import/first -- must be imported after the mock is registered */
import { attentionKey, buildAttentionItems } from './attention';
import { firstSteps, greetingPeriod } from './first-steps';
import { recallState } from './recall';
import { summarizeDay } from './summary';
/* eslint-enable import/first */

const at = (iso: string) => new Date(iso).getTime();
const NOW = at('2026-10-27T08:20:00.000Z'); // 14:20 in Bishkek

interface Fixture {
  id: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  start_at: string;
  duration: number;
  client_id: string;
  cancelled_by: string | null;
  price: number;
}

const appt = (
  id: string,
  start_at: string,
  status: AppointmentStatus = 'confirmed',
  extra: Partial<Fixture> = {},
): Fixture => ({
  id,
  status,
  source: 'manual',
  start_at,
  duration: 60,
  client_id: `client-${id}`,
  cancelled_by: null,
  price: 1000,
  ...extra,
});

describe('summarizeDay', () => {
  const day = [
    appt('maria', '2026-10-27T04:00:00.000Z', 'completed', { price: 1800 }),
    appt('alexey', '2026-10-27T05:30:00.000Z', 'confirmed', { price: 1800 }),
    appt('aigerim', '2026-10-27T08:00:00.000Z', 'confirmed', { price: 2400, duration: 90 }),
    appt('dinara', '2026-10-27T10:00:00.000Z', 'confirmed', { price: 2200 }),
    appt('elena', '2026-10-27T11:30:00.000Z', 'pending', { price: 600 }),
    appt('gone', '2026-10-27T09:00:00.000Z', 'cancelled', { price: 5000 }),
  ];

  it('reproduces the designed summary: 5 visits, 2 passed, 1 now, 2 ahead', () => {
    const summary = summarizeDay({
      appointments: day,
      priceOf: (a) => a.price,
      paid: new Map([['maria', 1800]]),
      now: NOW,
    });
    expect(summary.count).toBe(5);
    expect(summary.segments).toEqual(['done', 'done', 'now', 'ahead', 'ahead']);
    expect(summary.planned).toBe(8800);
    expect(summary.earned).toBe(1800);
    expect(summary.progress).toBeCloseTo(1800 / 8800);
  });

  it('is empty-safe', () => {
    expect(summarizeDay({ appointments: [], priceOf: () => 0, paid: new Map(), now: NOW })).toEqual(
      {
        count: 0,
        earned: 0,
        planned: 0,
        progress: 0,
        segments: [],
      },
    );
  });
});

describe('buildAttentionItems', () => {
  const tomorrow = {
    dayKey: '2026-10-28',
    start: '2026-10-27T18:00:00.000Z',
    end: '2026-10-28T18:00:00.000Z',
  };
  const appointments = [
    appt('reminder-1', '2026-10-28T05:00:00.000Z'),
    appt('reminder-2', '2026-10-28T07:00:00.000Z', 'pending'),
    appt('cancelled', '2026-10-29T09:00:00.000Z', 'cancelled', { cancelled_by: 'client' }),
    appt('cancelled-by-me', '2026-10-29T10:00:00.000Z', 'cancelled', { cancelled_by: 'master' }),
    appt('unconfirmed', '2026-10-27T11:30:00.000Z', 'pending'),
    appt('overdue', '2026-10-27T04:00:00.000Z', 'pending', { source: 'online_booking' }),
    appt('awaiting', '2026-10-27T05:30:00.000Z'),
    appt('done', '2026-10-27T03:00:00.000Z', 'completed'),
    appt('request', '2026-10-28T06:00:00.000Z', 'pending', { source: 'online_booking' }),
    appt('ongoing', '2026-10-27T08:00:00.000Z'),
  ];
  const recalls = [
    { clientId: 'b', cadenceDays: 21, sinceDays: 40 },
    { clientId: 'a', cadenceDays: 21, sinceDays: 49 },
  ];

  const build = (dismissed: string[] = []) =>
    buildAttentionItems({
      appointments,
      tomorrow,
      recalls,
      dismissed: new Set(dismissed),
      now: NOW,
    });

  it('lists the seven kinds in the design order', () => {
    expect(build().map((i) => i.key)).toEqual([
      'new_request:request',
      'awaiting_completion:awaiting',
      'overdue_request:overdue',
      'unconfirmed:unconfirmed',
      'unconfirmed:reminder-2',
      'client_cancelled:cancelled',
      'tomorrow_reminders:2026-10-28',
      'recall:a',
      'recall:b',
    ]);
  });

  it('groups tomorrow’s pending and confirmed visits into one reminder card', () => {
    const card = build().find((i) => i.kind === 'tomorrow_reminders');
    expect(card?.kind === 'tomorrow_reminders' && card.appointments.map((a) => a.id)).toEqual([
      'reminder-1',
      'request',
      'reminder-2',
    ]);
  });

  it('hides dismissed cards', () => {
    const keys = build([
      attentionKey('client_cancelled', 'cancelled'),
      attentionKey('tomorrow_reminders', '2026-10-28'),
      attentionKey('recall', 'a'),
    ]).map((i) => i.key);
    expect(keys).not.toContain('client_cancelled:cancelled');
    expect(keys).not.toContain('tomorrow_reminders:2026-10-28');
    expect(keys).toContain('recall:b');
    expect(keys).not.toContain('recall:a');
  });

  it('ignores a client cancellation whose time has passed', () => {
    const items = buildAttentionItems({
      appointments: [
        appt('old', '2026-10-26T09:00:00.000Z', 'cancelled', { cancelled_by: 'client' }),
      ],
      tomorrow,
      recalls: [],
      dismissed: new Set(),
      now: NOW,
    });
    expect(items).toEqual([]);
  });
});

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

describe('firstSteps', () => {
  const priced = { is_active: true, price: 1800 };
  const profile = { avatar_url: 'a', cover_url: 'c', bio: 'Мастер маникюра' };

  it('starts at 0 of 3 after onboarding', () => {
    const state = firstSteps({
      services: [{ is_active: true, price: 0 }, { is_active: true, price: 0 }, priced],
      clientCount: 0,
      profile: { avatar_url: null, cover_url: null, bio: null },
    });
    expect(state.doneCount).toBe(0);
    expect(state.complete).toBe(false);
    expect(state.steps[0]).toEqual({ id: 'prices', done: false, unpriced: 2 });
  });

  it('ignores inactive unpriced services and a blank bio', () => {
    const state = firstSteps({
      services: [priced, { is_active: false, price: 0 }],
      clientCount: 1,
      profile: { ...profile, bio: '   ' },
    });
    expect(state.steps.map((s) => s.done)).toEqual([true, true, false]);
  });

  it('is complete when all three are done', () => {
    expect(firstSteps({ services: [priced], clientCount: 3, profile }).complete).toBe(true);
  });
});

describe('greetingPeriod', () => {
  it('splits the day', () => {
    expect([4, 5, 11, 12, 16, 17, 22, 23].map(greetingPeriod)).toEqual([
      'night',
      'morning',
      'morning',
      'day',
      'day',
      'evening',
      'evening',
      'night',
    ]);
  });
});
