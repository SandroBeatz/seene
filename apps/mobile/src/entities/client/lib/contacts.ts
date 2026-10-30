/**
 * Phone book → client cards ("Добавить из контактов телефона"). A contact needs a
 * name; its first number that reads as a valid phone (international, or national in
 * the master's country) becomes the client's phone. Pure.
 */
import type { PhoneBookContact } from '@/shared/lib/phone-book';
import { resolvePhoneInput, type CountryCode } from '@/shared/lib/phone';
import type { Client, ClientCardDto } from '../model/types';
import { isValidBirthday } from './card';

export interface ImportCandidate {
  contactId: string;
  name: string;
  /** Canonical digits, or null when the contact has no usable number. */
  phone: string | null;
  card: ClientCardDto;
  /** A client with this number is already in the book. */
  exists: boolean;
}

export function contactToCard(contact: PhoneBookContact, country: CountryCode): ClientCardDto | null {
  let first = contact.givenName?.trim() ?? '';
  let last = contact.familyName?.trim() || null;
  if (!first && last) [first, last] = [last, null];
  if (!first) first = contact.fullName?.trim() ?? '';
  if (!first) return null;

  const phone =
    (contact.phones ?? [])
      .map((p) => (p.number ? resolvePhoneInput(p.number, country).canonical : ''))
      .find(Boolean) ?? null;
  const birthday =
    contact.birthday && isValidBirthday(contact.birthday.day, contact.birthday.month)
      ? contact.birthday
      : null;

  return {
    first_name: first,
    last_name: last,
    phone,
    birth_day: birthday?.day ?? null,
    birth_month: birthday?.month ?? null,
  };
}

/** Contacts as rows to pick from, alphabetical; those already in the book are marked. */
export function importCandidates(
  contacts: readonly PhoneBookContact[],
  clients: readonly Pick<Client, 'phone' | 'whatsapp'>[],
  country: CountryCode,
): ImportCandidate[] {
  const known = new Set(clients.flatMap((c) => [c.phone, c.whatsapp]).filter(Boolean));
  const seen = new Set<string>();
  const rows: ImportCandidate[] = [];
  for (const contact of contacts) {
    const card = contactToCard(contact, country);
    if (!card) continue;
    // The same number twice in the phone book becomes one client.
    if (card.phone) {
      if (seen.has(card.phone)) continue;
      seen.add(card.phone);
    }
    rows.push({
      contactId: contact.id,
      name: [card.first_name, card.last_name].filter(Boolean).join(' '),
      phone: card.phone ?? null,
      card,
      exists: !!card.phone && known.has(card.phone),
    });
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}
