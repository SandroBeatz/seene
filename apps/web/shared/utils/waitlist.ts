/** The founding masters form: the same rules on the page and on the server. */

export const WAITLIST_CITIES = ['bishkek', 'toronto', 'vancouver', 'other'] as const
export const WAITLIST_SPECIALTIES = ['manicure', 'pedicure', 'brows', 'lashes', 'other'] as const

export type WaitlistCity = (typeof WAITLIST_CITIES)[number]
export type WaitlistSpecialty = (typeof WAITLIST_SPECIALTIES)[number]

export const WAITLIST_NAME_MAX = 60
export const WAITLIST_CONTACT_MAX = 100
/** Applications from one IP per hour */
export const WAITLIST_MAX_PER_IP_HOUR = 5
/** A form sent faster than this after it was shown is a bot */
export const WAITLIST_MIN_FILL_MS = 2500

export type WaitlistInput = {
  name: string
  contact: string
  city: WaitlistCity
  specialties: WaitlistSpecialty[]
}

/** Trimmed, valid input, or null. */
export function parseWaitlistInput(value: {
  name?: unknown
  contact?: unknown
  city?: unknown
  specialties?: unknown
}): WaitlistInput | null {
  const name = typeof value.name === 'string' ? value.name.trim() : ''
  const contact = typeof value.contact === 'string' ? value.contact.trim() : ''
  const city = WAITLIST_CITIES.find((item) => item === value.city)
  const specialties = Array.isArray(value.specialties)
    ? WAITLIST_SPECIALTIES.filter((item) => (value.specialties as unknown[]).includes(item))
    : []

  if (!name || name.length > WAITLIST_NAME_MAX) return null
  if (contact.length < 2 || contact.length > WAITLIST_CONTACT_MAX) return null
  if (!city || !specialties.length) return null

  return { name, contact, city, specialties }
}
