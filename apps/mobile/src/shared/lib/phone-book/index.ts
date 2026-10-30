/**
 * The phone's address book (expo-contacts): read every contact's name, numbers and
 * birthday after asking for access, or let the master pick one contact in the
 * system picker. The only expo-contacts import site.
 */
import { Contact, ContactField, requestPermissionsAsync } from 'expo-contacts';

/** A phone book entry, as much as Seene reads of it. */
export interface PhoneBookContact {
  id: string;
  givenName?: string | null;
  familyName?: string | null;
  fullName?: string | null;
  phones?: readonly { number?: string | null }[] | null;
  birthday?: { day: number; month: number } | null;
}

/** Full access, only the contacts the master shared (iOS 18+), or none. */
export type PhoneBookAccess = 'all' | 'limited' | 'none';

const FIELDS = [
  ContactField.GIVEN_NAME,
  ContactField.FAMILY_NAME,
  ContactField.FULL_NAME,
  ContactField.PHONES,
  ContactField.BIRTHDAY,
] as const;

type Details = Awaited<ReturnType<typeof Contact.getAllDetails<typeof FIELDS>>>[number];

function toEntry(details: Details): PhoneBookContact {
  return {
    id: details.id,
    givenName: details.givenName,
    familyName: details.familyName,
    fullName: details.fullName,
    phones: details.phones,
    birthday: details.birthday ? { day: details.birthday.day, month: details.birthday.month } : null,
  };
}

export async function requestPhoneBook(): Promise<PhoneBookAccess> {
  const permission = await requestPermissionsAsync();
  if (!permission.granted) return 'none';
  return permission.accessPrivileges === 'limited' ? 'limited' : 'all';
}

export async function readPhoneBook(): Promise<PhoneBookContact[]> {
  return (await Contact.getAllDetails(FIELDS)).map(toEntry);
}

/** Lets the master share more contacts when access is limited (iOS 18+). */
export async function shareMoreContacts(): Promise<void> {
  await Contact.presentAccessPicker();
}

/** One contact from the system picker, or null when the master cancels. */
export async function pickPhoneBookContact(): Promise<PhoneBookContact | null> {
  const contact = await Contact.presentPicker();
  if (!contact) return null;
  return toEntry(await contact.getDetails(FIELDS));
}
