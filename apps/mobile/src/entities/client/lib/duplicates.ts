/**
 * "Объединить дубли": who else in the book is probably the same person — the same
 * number (phone or WhatsApp), the same full name, or the same first name with no
 * contradicting last name. Strongest match first. Pure.
 */
import type { Client } from '../model/types';

export type DuplicateReason = 'phone' | 'name' | 'firstName';

export interface DuplicateCandidate {
  client: Client;
  reason: DuplicateReason;
}

type Card = Pick<Client, 'id' | 'first_name' | 'last_name' | 'phone' | 'whatsapp'>;

const fold = (value: string | null | undefined) =>
  (value ?? '').trim().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');

const numbersOf = (c: Card) => [c.phone, c.whatsapp].filter((n): n is string => !!n);

const RANK: Record<DuplicateReason, number> = { phone: 0, name: 1, firstName: 2 };

export function duplicateReason(a: Card, b: Card): DuplicateReason | null {
  const theirs = numbersOf(b);
  if (numbersOf(a).some((n) => theirs.includes(n))) return 'phone';
  const firstA = fold(a.first_name);
  if (!firstA || firstA !== fold(b.first_name)) return null;
  const lastA = fold(a.last_name);
  const lastB = fold(b.last_name);
  if (lastA && lastA === lastB) return 'name';
  // "Алиса" and "Алиса В.": one has no last name, or one is the other's initial.
  if (!lastA || !lastB || lastA[0] === lastB[0]) return 'firstName';
  return null;
}

export function duplicateCandidates(client: Card, all: readonly Client[]): DuplicateCandidate[] {
  return all
    .filter((other) => other.id !== client.id)
    .map((other) => ({ client: other, reason: duplicateReason(client, other) }))
    .filter((c): c is DuplicateCandidate => c.reason !== null)
    .sort((a, b) => RANK[a.reason] - RANK[b.reason]);
}
