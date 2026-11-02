import { describe, expect, it } from '@jest/globals';
import { barsOf, metricDeltas, percentChange, shareOf } from './overview';
import type { Period, PeriodMetrics } from '@/entities/analytics';

const labels = {
  weekdays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  monthInitials: ['Я', 'Ф', 'М', 'А', 'М', 'И', 'И', 'А', 'С', 'О', 'Н', 'Д'],
};
const week: Period = { unit: 'week', startKey: '2026-10-26', endKey: '2026-11-01' };
const month: Period = { unit: 'month', startKey: '2026-10-01', endKey: '2026-10-31' };
const days = ['2026-10-26', '2026-10-27', '2026-10-28'];
const series = (amounts: number[]) => ({
  series: amounts.map((amount, i) => ({ day: days[i], amount })),
});
const metrics = (over: Partial<PeriodMetrics> = {}): PeriodMetrics => ({
  earned: 0,
  tips: 0,
  visits: 0,
  avg_check: null,
  no_shows: 0,
  new_clients: 0,
  spent: 0,
  load_pct: null,
  free_minutes: null,
  ...over,
});

describe('barsOf', () => {
  it('marks today and the days after it', () => {
    const bars = barsOf(series([100, 200, 0]), week, 'day', '2026-10-27', labels);
    expect(bars.map((b) => b.state)).toEqual(['past', 'current', 'future']);
    expect(bars.map((b) => b.label)).toEqual(['Пн', 'Вт', 'Ср']);
  });

  it('marks the last bar with money in a finished period', () => {
    const bars = barsOf(series([100, 200, 0]), week, 'day', '2026-11-20', labels);
    expect(bars.map((b) => b.state)).toEqual(['past', 'current', 'future']);
  });

  it('labels every fifth day of a month', () => {
    const bars = barsOf(series([0, 0, 0]), month, 'day', '2026-11-20', labels);
    expect(bars.map((b) => b.label)).toEqual(['26', '', '']);
  });

  it('labels months by initial and finds this month', () => {
    const bars = barsOf(
      { series: [{ day: '2026-10-01', amount: 1 }, { day: '2026-11-01', amount: 0 }] },
      { unit: 'year', startKey: '2026-01-01', endKey: '2026-12-31' },
      'month',
      '2026-11-02',
      labels,
    );
    expect(bars.map((b) => [b.label, b.state])).toEqual([
      ['О', 'past'],
      ['Н', 'current'],
    ]);
  });
});

describe('metricDeltas', () => {
  it('reads fewer no-shows as good and more as bad', () => {
    expect(metricDeltas(metrics({ no_shows: 1 }), metrics({ no_shows: 3 })).noShows).toEqual({
      direction: 'down',
      value: 2,
      tone: 'good',
    });
    expect(metricDeltas(metrics({ no_shows: 3 }), metrics({ no_shows: 1 })).noShows.tone).toBe('bad');
  });

  it('gives the average check in percent, none without a previous one', () => {
    expect(metricDeltas(metrics({ avg_check: 1050 }), metrics({ avg_check: 1000 })).avgCheck).toEqual(
      { direction: 'up', value: 5, tone: 'good' },
    );
    expect(metricDeltas(metrics({ avg_check: 1050 }), metrics()).avgCheck).toBeNull();
  });

  it('has no load delta without working hours', () => {
    expect(metricDeltas(metrics({ load_pct: 50 }), metrics()).load).toBeNull();
  });

  it('says when nothing changed', () => {
    expect(metricDeltas(metrics({ visits: 2 }), metrics({ visits: 2 })).visits.direction).toBe('same');
  });
});

describe('percentChange and shareOf', () => {
  it('has no percent against zero', () => {
    expect(percentChange(100, 0)).toBeNull();
    expect(percentChange(112, 100)).toBe(12);
  });

  it('has a zero share of nothing', () => {
    expect(shareOf(1, 0)).toBe(0);
    expect(shareOf(58, 100)).toBe(58);
  });
});
