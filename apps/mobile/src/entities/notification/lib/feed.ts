/** How the feed sorts and names things. Pure, `now`-injected. */
import { DateTime } from 'luxon';
import type { Notification, NotificationCategory, NotificationKind } from '../model/types';

export const KIND_CATEGORY: Record<NotificationKind, NotificationCategory> = {
  booking_new: 'visits',
  booking_cancelled: 'visits',
  booking_moved: 'visits',
};

export const categoryOf = (row: Pick<Notification, 'kind'>) => KIND_CATEGORY[row.kind];

export type FeedDay = 'today' | 'yesterday' | 'earlier';

export function feedDay(createdAt: string, zone: string, now: number): FeedDay {
  const day = DateTime.fromISO(createdAt, { zone: 'utc' }).setZone(zone).startOf('day');
  const today = DateTime.fromMillis(now, { zone }).startOf('day');
  const days = Math.round(today.diff(day, 'days').days);
  if (days <= 0) return 'today';
  return days === 1 ? 'yesterday' : 'earlier';
}

/** Rows in their order, grouped under the days they fell on. */
export function groupByDay<T extends Pick<Notification, 'created_at'>>(
  rows: readonly T[],
  zone: string,
  now: number,
): { day: FeedDay; rows: T[] }[] {
  const groups: { day: FeedDay; rows: T[] }[] = [];
  for (const row of rows) {
    const day = feedDay(row.created_at, zone, now);
    const last = groups[groups.length - 1];
    if (last?.day === day) last.rows.push(row);
    else groups.push({ day, rows: [row] });
  }
  return groups;
}

/** "Айгерим Касымова" → "Айгерим К.". */
export function shortName(name: string | null | undefined): string {
  const [first, ...rest] = (name ?? '').trim().split(/\s+/);
  const last = rest[rest.length - 1];
  return last ? `${first} ${last[0]!.toLocaleUpperCase()}.` : (first ?? '');
}
