/** The address as one line ("Бишкек, Киевская 95"), or '' when there is none. */
export function addressLine(profile: {
  city: string | null;
  address: string | null;
  house_number: string | null;
}): string {
  const street = [profile.address, profile.house_number]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  return [profile.city?.trim(), street].filter(Boolean).join(', ');
}
