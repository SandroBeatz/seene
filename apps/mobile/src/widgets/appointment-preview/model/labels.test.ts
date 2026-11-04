import { describe, expect, it, jest } from '@jest/globals';

// The appointment entity's api constructs the Supabase client at import — stub it.
jest.mock('@/shared/api/supabase', () => ({ supabase: {} }));

/* eslint-disable import/first -- must be imported after the mock is registered */
import { MORE_MENU, relativeDay, statusLabel, willAutoComplete } from './labels';
/* eslint-enable import/first */

const START = '2026-10-30T10:00:00.000Z';
const at = (iso: string) => new Date(iso).getTime();
const time = () => '16:00';

describe('statusLabel', () => {
  it('counts down to an upcoming visit in minutes, then hours', () => {
    expect(
      statusLabel('upcoming', { start_at: START }, at('2026-10-30T09:35:00.000Z'), time),
    ).toEqual({
      key: 'preview.status.upcomingMinutes',
      params: { count: 25 },
    });
    expect(
      statusLabel('upcoming', { start_at: START }, at('2026-10-30T08:05:00.000Z'), time),
    ).toEqual({
      key: 'preview.status.upcomingHours',
      params: { count: 2 },
    });
  });

  it('drops the countdown half a day ahead', () => {
    expect(
      statusLabel('upcoming', { start_at: START }, at('2026-10-29T10:00:00.000Z'), time),
    ).toEqual({
      key: 'preview.status.upcoming',
    });
  });

  it('shows the start of an ongoing visit and plain keys otherwise', () => {
    expect(statusLabel('ongoing', { start_at: START }, at(START), time)).toEqual({
      key: 'preview.status.ongoing',
      params: { time: '16:00' },
    });
    expect(statusLabel('awaiting', { start_at: START }, 0, time)).toEqual({
      key: 'preview.status.awaiting',
    });
  });
});

describe('relativeDay', () => {
  it('names the neighbouring days only', () => {
    expect(relativeDay('2026-10-30', '2026-10-30')).toBe('today');
    expect(relativeDay('2026-10-31', '2026-10-30')).toBe('tomorrow');
    expect(relativeDay('2026-10-29', '2026-10-30')).toBe('yesterday');
    expect(relativeDay('2026-10-26', '2026-10-30')).toBeNull();
    expect(relativeDay('2026-11-01', '2026-10-31')).toBe('tomorrow');
  });
});

describe('MORE_MENU', () => {
  it('matches the designed menu of an upcoming visit', () => {
    expect(MORE_MENU.upcoming).toEqual({
      regular: ['book_again', 'note', 'send_details'],
      danger: ['no_show', 'delete'],
    });
  });

  it('offers delete in every phase', () => {
    for (const menu of Object.values(MORE_MENU)) expect(menu.danger).toContain('delete');
  });
});

describe('auto-complete labels', () => {
  const time = () => '';

  it('says a visit completed by itself', () => {
    expect(
      statusLabel('completed', { start_at: '2026-11-04T10:00:00Z', auto_completed: true }, 0, time),
    ).toEqual({ key: 'preview.status.completedAuto' });
  });

  it('keeps the plain label for a visit completed by hand', () => {
    expect(
      statusLabel(
        'completed',
        { start_at: '2026-11-04T10:00:00Z', auto_completed: false },
        0,
        time,
      ),
    ).toEqual({ key: 'preview.status.completed' });
  });

  it('offers the icon only while the setting covers the visit', () => {
    const end = '2026-11-04T12:00:00Z';
    expect(willAutoComplete('upcoming', end, '2026-11-04T09:00:00Z')).toBe(true);
    expect(willAutoComplete('ongoing', end, '2026-11-04T09:00:00Z')).toBe(true);
    expect(willAutoComplete('upcoming', end, null)).toBe(false);
    expect(willAutoComplete('request', end, '2026-11-04T09:00:00Z')).toBe(false);
    expect(willAutoComplete('upcoming', end, '2026-11-04T13:00:00Z')).toBe(false);
  });
});
