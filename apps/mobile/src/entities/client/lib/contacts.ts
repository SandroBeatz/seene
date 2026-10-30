/**
 * A phone book contact → a client card ("Добавить из контактов телефона"). It needs
 * a name; its first number that reads as a valid phone (international, or national
 * in the master's country) becomes the client's phone. Pure.
 */
import type { PhoneBookContact } from '@/shared/lib/phone-book';
import { resolvePhoneInput, type CountryCode } from '@/shared/lib/phone';
import type { ClientCardDto } from '../model/types';
import { isValidBirthday } from './card';

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
