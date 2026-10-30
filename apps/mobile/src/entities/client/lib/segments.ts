/**
 * The client list's filters (design "Клиенты": Все · Пора позвать · VIP · Новые ·
 * Постоянные) and search. Pure; visit counts come from `client_summaries()`.
 */
import type { Client, ClientSummary } from '../model/types';
import { isNewClient } from './derive';

export type ClientSegment = 'all' | 'recall' | 'vip' | 'new' | 'regular';

export const CLIENT_SEGMENTS: readonly ClientSegment[] = ['all', 'recall', 'vip', 'new', 'regular'];

/** Finished visits that make a client a regular. */
export const REGULAR_VISITS = 3;

export interface SegmentInput {
  client: Pick<Client, 'id' | 'is_favorite'>;
  summary: Pick<ClientSummary, 'visits'> | undefined;
  /** Due for a call (`recallCandidates`). */
  recall: boolean;
}

export function inSegment(segment: ClientSegment, { client, summary, recall }: SegmentInput): boolean {
  const visits = summary?.visits ?? 0;
  switch (segment) {
    case 'all':
      return true;
    case 'recall':
      return recall;
    case 'vip':
      return client.is_favorite;
    case 'new':
      return isNewClient(visits);
    case 'regular':
      return visits >= REGULAR_VISITS;
  }
}

/** Lower-case, "ё" read as "е": "Алёна" is found by "алена". */
function fold(value: string): string {
  return value.toLowerCase().replace(/ё/g, 'е');
}

/**
 * Search by name (any part) or phone: digits typed anywhere in the query are matched
 * against the stored number, so "555 12" finds +996 555 12 34 56.
 */
export function matchesClientQuery(
  client: Pick<Client, 'first_name' | 'last_name' | 'phone'>,
  query: string,
): boolean {
  const q = fold(query.trim());
  if (!q) return true;
  const name = fold([client.first_name, client.last_name].filter(Boolean).join(' '));
  if (name.includes(q)) return true;
  const digits = q.replace(/\D/g, '');
  return digits.length >= 3 && !!client.phone?.includes(digits);
}
