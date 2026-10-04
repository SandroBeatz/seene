/**
 * Phone helpers shared by the booking UI and the server API.
 *
 * Every phone that crosses the client → server boundary is in E.164 form
 * ('+996555123456'), the same format the master dashboard (master.seene) stores
 * in `client.phone`. The server re-validates with these helpers, so a value
 * that is not a valid E.164 number never reaches the database.
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

/** Valid number → E.164 string, anything else → null. */
export function toE164(value: string, defaultCountry?: CountryCode): string | null {
  const parsed = parsePhoneNumberFromString(value.trim(), defaultCountry)
  return parsed?.isValid() ? parsed.number : null
}

/** Digits-only key used to match legacy rows stored without '+' or formatting. */
export function phoneDigits(value: string) {
  return value.replace(/\D/g, '')
}

export interface PhoneInputState {
  /** Country detected from the number, or the selected one for national input. */
  country?: CountryCode
  /** Formatted as-you-type value shown in the input. */
  display: string
  /** E.164 value when the number is valid, otherwise ''. */
  e164: string
}

/**
 * Resolve raw input: '+…' is parsed internationally (the country is detected
 * from the calling code), anything else is treated as a national number of the
 * selected country. A national trunk prefix ('0500…' in KG, '8916…' in RU) is
 * handled by libphonenumber.
 */
export function resolvePhoneInput(value: string, country?: CountryCode): PhoneInputState {
  const trimmed = value.trim()

  if (!trimmed) {
    return { country, display: '', e164: '' }
  }

  const international = trimmed.startsWith('+')
  const typer = new AsYouType(international ? undefined : country)
  const display = typer.input(international ? `+${phoneDigits(trimmed)}` : trimmed)
  const number = typer.getNumber()

  return {
    country: typer.getCountry() ?? (international ? undefined : country),
    display,
    e164: number?.isValid() ? number.number : ''
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
