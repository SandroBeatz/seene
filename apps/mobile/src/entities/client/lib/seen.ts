/**
 * The list row's second line — when the client was last here ("7 недель назад") or,
 * when they come today, at what time ("Сегодня в 14:00"). Calendar days in the
 * master's zone. Pure, `now`-injected.
 */
import { DateTime } from 'luxon';
import type { ClientSummary } from '../model/types';

export type Seen =
  | { kind: 'todayAt'; at: string }
  | { kind: 'today' }
  | { kind: 'yesterday' }
  | { kind: 'days'; count: number }
  | { kind: 'weeks'; count: number }
  | { kind: 'months'; count: number }
  | { kind: 'booked'; at: string }
  | { kind: 'never' };

type SeenInput = Pick<ClientSummary, 'lastVisit' | 'nextVisit'> | undefined;

export function seenOf(summary: SeenInput, now: number, zone: string): Seen {
  const today = DateTime.fromMillis(now, { zone }).startOf('day');
  const dayOf = (iso: string) =>
    DateTime.fromISO(iso, { zone: 'utc' }).setZone(zone).startOf('day');

  if (summary?.nextVisit && dayOf(summary.nextVisit).equals(today)) {
    return { kind: 'todayAt', at: summary.nextVisit };
  }
  if (summary?.lastVisit) {
    const days = Math.round(today.diff(dayOf(summary.lastVisit), 'days').days);
    if (days <= 0) return { kind: 'today' };
    if (days === 1) return { kind: 'yesterday' };
    if (days < 14) return { kind: 'days', count: days };
    if (days < 60) return { kind: 'weeks', count: Math.floor(days / 7) };
    return { kind: 'months', count: Math.floor(days / 30) };
  }
  if (summary?.nextVisit) return { kind: 'booked', at: summary.nextVisit };
  return { kind: 'never' };
}
