/**
 * The phone's address book (expo-contacts): the system contact picker, read into
 * the fields Seene uses. The only expo-contacts import site.
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

const FIELDS = [
  ContactField.GIVEN_NAME,
  ContactField.FAMILY_NAME,
  ContactField.FULL_NAME,
  ContactField.PHONES,
  ContactField.BIRTHDAY,
] as const;

async function readDetails(contact: Contact): Promise<PhoneBookContact> {
  const details = await contact.getDetails(FIELDS);
  return {
    id: details.id,
    givenName: details.givenName,
    familyName: details.familyName,
    fullName: details.fullName,
    phones: details.phones,
    birthday: details.birthday ? { day: details.birthday.day, month: details.birthday.month } : null,
  };
}

/**
 * One contact from the system picker, or null when the master cancels. The picker
 * itself needs no access; reading the picked card may, so it is asked for then.
 */
export async function pickPhoneBookContact(): Promise<PhoneBookContact | null> {
  const contact = await Contact.presentPicker();
  if (!contact) return null;
  try {
    return await readDetails(contact);
  } catch (error) {
    if (!(await requestPermissionsAsync()).granted) throw error;
    return readDetails(contact);
  }
}
