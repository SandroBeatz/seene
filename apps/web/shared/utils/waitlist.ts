/** The founding masters form: the same rules on the page and on the server. */

import { MARKET_CITIES, isMarket, type Market } from './market'

export const WAITLIST_NAME_MAX = 60
export const WAITLIST_CONTACT_MAX = 100
export const WAITLIST_SPECIALTY_MAX = 100
export const WAITLIST_PLACE_MAX = 100
/** Applications from one IP per hour */
export const WAITLIST_MAX_PER_IP_HOUR = 5
/** A form sent faster than this after it was shown is a bot */
export const WAITLIST_MIN_FILL_MS = 2500

export type WaitlistInput = {
  name: string
  contact: string
  country: Market
  /** A city from the country's list (Kyrgyzstan, Canada), else null */
  city: string | null
  /** "Almaty, Kazakhstan" as typed, for another country, else null */
  place: string | null
  /** What she does, in her words: "nails, brows" */
  specialty: string
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

/** Trimmed, valid input, or null. */
export function parseWaitlistInput(value: {
  name?: unknown
  contact?: unknown
  country?: unknown
  city?: unknown
  place?: unknown
  specialty?: unknown
}): WaitlistInput | null {
  const name = text(value.name)
  const contact = text(value.contact)
  const specialty = text(value.specialty)
  const country = value.country

  if (!name || name.length > WAITLIST_NAME_MAX) return null
  if (contact.length < 2 || contact.length > WAITLIST_CONTACT_MAX) return null
  if (specialty.length < 2 || specialty.length > WAITLIST_SPECIALTY_MAX) return null
  if (!isMarket(country)) return null

  if (country === 'other') {
    const place = text(value.place)
    if (place.length < 2 || place.length > WAITLIST_PLACE_MAX) return null
    return { name, contact, country, city: null, place, specialty }
  }

  const cities: readonly string[] = MARKET_CITIES[country]
  if (!cities.includes(value.city as string)) return null
  return { name, contact, country, city: value.city as string, place: null, specialty }
}
