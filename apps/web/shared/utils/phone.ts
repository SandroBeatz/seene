/**
 * Phone helpers shared by the booking UI and the server API.
 *
 * CANONICAL FORMAT — strict rule:
 *   A phone is stored, sent to the API and returned by the API as the E.164
 *   digits only: country calling code + national number, no '+', no spaces,
 *   no punctuation. Example: '996555123456'.
 *
 * Formatting ('+996 555 123 456') is display-only and happens in the UI via
 * `resolvePhoneInput` / `formatPhone`. Never send a formatted value to the API
 * and never persist one. The server re-validates with `toCanonicalPhone`, so a
 * value that is not a valid number never reaches the database.
 */
import {
  AsYouType,
  getCountryCallingCode,
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode
} from 'libphonenumber-js'

export type { CountryCode }

export function toPhoneCountry(value: string | null | undefined): CountryCode | undefined {
  const code = value?.trim().toUpperCase()
  return code && isSupportedCountry(code) ? code : undefined
}

/** Strip everything but digits. */
export function phoneDigits(value: string) {
  return value.replace(/\D/g, '')
}

/**
 * Strict canonical check: `value` must already be digits only ('996555123456')
 * and form a valid number. Returns it unchanged, or null.
 */
export function toCanonicalPhone(value: string): string | null {
  if (!/^\d+$/.test(value)) return null
  return parsePhoneNumberFromString(`+${value}`)?.isValid() ? value : null
}

/** Canonical digits → international display ('+996 555 123 456'). */
export function formatPhone(canonical: string): string {
  if (!canonical) return ''
  return parsePhoneNumberFromString(`+${canonical}`)?.formatInternational() ?? `+${canonical}`
}

export interface PhoneInputState {
  /** Country detected from the number, or the selected one for national input. */
  country?: CountryCode
  /** Formatted as-you-type value shown in the input. */
  display: string
  /** Canonical digits ('996555123456') when the number is valid, otherwise ''. */
  canonical: string
}

/**
 * Resolve raw input:
 * - '+…' is parsed internationally; the country is detected from the calling code.
 * - Anything else is a national number of the selected country. A trunk prefix
 *   ('0555…' in KG, '8916…' in RU) is dropped — the dial code is already shown
 *   next to the field — and the rest is grouped like the international format of
 *   that country without the code ('555 123 456', '916 123 45 67').
 */
export function resolvePhoneInput(value: string, country?: CountryCode): PhoneInputState {
  const trimmed = value.trim()

  if (!trimmed) {
    return { country, display: '', canonical: '' }
  }

  if (trimmed.startsWith('+') || !country) {
    const typer = new AsYouType()
    const display = typer.input(`+${phoneDigits(trimmed)}`)
    const number = typer.getNumber()
    return {
      country: typer.getCountry() ?? country,
      display,
      canonical: number?.isValid() ? phoneDigits(number.number) : ''
    }
  }

  const national = new AsYouType(country)
  national.input(phoneDigits(trimmed))
  const nationalNumber = national.getNationalNumber()
  if (!nationalNumber) {
    return { country, display: '', canonical: '' }
  }

  const callingCode = getCountryCallingCode(country)
  const typer = new AsYouType()
  const formatted = typer.input(`+${callingCode}${nationalNumber}`)
  const number = typer.getNumber()

  return {
    country,
    display: formatted.slice(`+${callingCode}`.length).trim(),
    canonical: number?.isValid() ? phoneDigits(number.number) : ''
  }
}

export function dialCode(country: CountryCode) {
  return `+${getCountryCallingCode(country)}`
}

/** Regional-indicator emoji flag for an ISO 3166-1 alpha-2 code. */
export function countryFlag(country: string) {
  return String.fromCodePoint(
    ...country
      .toUpperCase()
      .split('')
      .map((char) => 0x1f1e6 + char.charCodeAt(0) - 65)
  )
}
