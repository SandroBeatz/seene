/**
 * The period "Аналитика" shows: a week, month or year stepped with the arrows, or the
 * master's own dates. Periods are calendar keys in the master's zone; `periodRange`
 * turns them into the instants the RPC reads. Pure, today is injected.
 */
import { DateTime } from 'luxon';

export type PeriodUnit = 'week' | 'month' | 'year' | 'custom';

export interface Period {
  unit: PeriodUnit;
  /** "yyyy-MM-dd", both inclusive. */
  startKey: string;
  endKey: string;
}

export interface PeriodRange {
  from: string;
  to: string;
  prevFrom: string;
  prevTo: string;
  granularity: 'day' | 'month';
}

/** Up to two months a bar per day still reads; longer goes by month. */
const MAX_DAILY_BARS = 62;

const parse = (key: string, zone: string) => DateTime.fromISO(key, { zone });
const keyOf = (date: DateTime) => date.toISODate()!;

/** Days in the period, ends included. */
export function periodDays(period: Pick<Period, 'startKey' | 'endKey'>): number {
  const start = DateTime.fromISO(period.startKey, { zone: 'utc' });
  const end = DateTime.fromISO(period.endKey, { zone: 'utc' });
  return Math.round(end.diff(start, 'days').days) + 1;
}

export function currentPeriod(
  unit: Exclude<PeriodUnit, 'custom'>,
  todayKey: string,
  zone: string,
): Period {
  const today = parse(todayKey, zone);
  return {
    unit,
    startKey: keyOf(today.startOf(unit)),
    endKey: keyOf(today.endOf(unit)),
  };
}

export function customPeriod(startKey: string, endKey: string): Period {
  return { unit: 'custom', startKey, endKey };
}

/** The same kind of period `direction` steps away (a custom one by its own length). */
export function shiftPeriod(period: Period, direction: 1 | -1, zone: string): Period {
  const start = parse(period.startKey, zone);
  if (period.unit === 'custom') {
    const days = periodDays(period) * direction;
    return {
      unit: 'custom',
      startKey: keyOf(start.plus({ days })),
      endKey: keyOf(parse(period.endKey, zone).plus({ days })),
    };
  }
  const moved = start.plus({ [period.unit]: direction });
  return {
    unit: period.unit,
    startKey: keyOf(moved.startOf(period.unit)),
    endKey: keyOf(moved.endOf(period.unit)),
  };
}

/** The future has nothing to show: no stepping past the period holding today. */
export function canStepForward(period: Period, todayKey: string): boolean {
  return period.endKey < todayKey;
}

/**
 * The instants of a period and of the one it's compared with. A period still running
 * is compared with the same number of days of the previous one: the 2nd of November
 * against all of October would always read as a collapse.
 */
export function periodRange(period: Period, todayKey: string, zone: string): PeriodRange {
  const start = parse(period.startKey, zone);
  const end = parse(period.endKey, zone).plus({ days: 1 });
  const previous = shiftPeriod(period, -1, zone);
  const prevStart = parse(previous.startKey, zone);
  const prevEnd = parse(previous.endKey, zone).plus({ days: 1 });

  const running = period.startKey <= todayKey && todayKey <= period.endKey;
  const elapsed = running
    ? periodDays({ startKey: period.startKey, endKey: todayKey })
    : periodDays(period);
  const sameLength = prevStart.plus({ days: elapsed });
  const prevTo = running && sameLength < prevEnd ? sameLength : prevEnd;

  const byMonth =
    period.unit === 'year' || (period.unit === 'custom' && periodDays(period) > MAX_DAILY_BARS);

  return {
    from: start.toUTC().toISO()!,
    to: end.toUTC().toISO()!,
    prevFrom: prevStart.toUTC().toISO()!,
    prevTo: prevTo.toUTC().toISO()!,
    granularity: byMonth ? 'month' : 'day',
  };
}
