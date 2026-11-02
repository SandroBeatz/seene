/**
 * Turning the overview into what the screen draws: bars with their state, tile deltas
 * (arrows and their good/bad tone) and shares. Pure; texts are passed in.
 */
import { DateTime } from 'luxon';
import type { MoneyOverview, Period, PeriodMetrics } from '@/entities/analytics';

export type BarState = 'past' | 'current' | 'future';

export interface Bar {
  key: string;
  /** Under the bar; empty for most days of a month. */
  label: string;
  amount: number;
  state: BarState;
}

export interface BarLabels {
  weekdays: readonly string[];
  /** Month initials, January first. */
  monthInitials: readonly string[];
}

/**
 * Today's bar is the dark one, later ones the lightest. A finished period has no today:
 * its last bar with money takes that place.
 */
export function barsOf(
  overview: Pick<MoneyOverview, 'series'>,
  period: Period,
  granularity: 'day' | 'month',
  todayKey: string,
  labels: BarLabels,
): Bar[] {
  const { series } = overview;
  const bucketOfToday = granularity === 'month' ? `${todayKey.slice(0, 7)}-01` : todayKey;
  let current = series.findIndex((point) => point.day === bucketOfToday);
  if (current < 0) {
    current = series.reduce((last, point, index) => (point.amount > 0 ? index : last), -1);
  }
  return series.map((point, index) => {
    const date = DateTime.fromISO(point.day, { zone: 'utc' });
    let label: string;
    if (granularity === 'month') label = labels.monthInitials[date.month - 1] ?? '';
    else if (period.unit === 'week') label = labels.weekdays[date.weekday - 1] ?? '';
    else label = index % 5 === 0 ? String(date.day) : '';
    return {
      key: point.day,
      label,
      amount: point.amount,
      state: index === current ? 'current' : index > current ? 'future' : 'past',
    };
  });
}

export type DeltaTone = 'good' | 'bad' | 'neutral';

export interface Delta {
  /** Up, down or same; the text is built by the caller. */
  direction: 'up' | 'down' | 'same';
  /** Absolute change: a count, percent or amount. */
  value: number;
  tone: DeltaTone;
}

function deltaOf(now: number, before: number, lessIsBetter = false): Delta {
  const diff = now - before;
  if (diff === 0) return { direction: 'same', value: 0, tone: 'neutral' };
  const up = diff > 0;
  return {
    direction: up ? 'up' : 'down',
    value: Math.abs(diff),
    tone: up !== lessIsBetter ? 'good' : 'bad',
  };
}

/** Percent change, or null when there is nothing to compare with. */
export function percentChange(now: number, before: number): number | null {
  if (before <= 0) return null;
  return Math.round(((now - before) / before) * 100);
}

export interface MetricDeltas {
  visits: Delta;
  /** In percent; null without a previous average. */
  avgCheck: Delta | null;
  noShows: Delta;
  newClients: Delta;
  /** In percentage points; null without working hours in either period. */
  load: Delta | null;
  tips: Delta;
}

export function metricDeltas(now: PeriodMetrics, before: PeriodMetrics): MetricDeltas {
  const avg =
    now.avg_check !== null && before.avg_check !== null
      ? percentChange(now.avg_check, before.avg_check)
      : null;
  return {
    visits: deltaOf(now.visits, before.visits),
    avgCheck: avg === null ? null : deltaOf(avg, 0),
    noShows: deltaOf(now.no_shows, before.no_shows, true),
    newClients: deltaOf(now.new_clients, before.new_clients),
    load:
      now.load_pct !== null && before.load_pct !== null
        ? deltaOf(now.load_pct, before.load_pct)
        : null,
    tips: deltaOf(now.tips, before.tips),
  };
}

/** Whole percents of a total; 0 when the total is. */
export function shareOf(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}
