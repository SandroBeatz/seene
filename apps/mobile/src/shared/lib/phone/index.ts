/**
 * Phone display helpers. Canonical format everywhere is E.164 digits without "+"
 * ('996555123456', see the repo AGENTS.md); formatting is display-only. Mirrors
 * apps/web/shared/utils/phone.ts.
 */
import {
  AsYouType,
  getCountryCallingCode,
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';
import { TIME_ZONES } from '@/shared/config/time-zones';

export type { CountryCode };

export function toPhoneCountry(value: string | null | undefined): CountryCode | undefined {
  const code = value?.trim().toUpperCase();
  return code && isSupportedCountry(code) ? code : undefined;
}

/**
 * The country a new number is typed in: the master's time zone says where they work
 * (Asia/Bishkek → KG), then their profile country, then the phone's region.
 */
export function defaultPhoneCountry(
  zone: string | null | undefined,
  profileCountry?: string | null,
  deviceRegion?: string | null,
): CountryCode {
  const fromZone = TIME_ZONES.find((entry) => entry.id === zone)?.country;
  return (
    toPhoneCountry(fromZone) ?? toPhoneCountry(profileCountry) ?? toPhoneCountry(deviceRegion) ?? 'KG'
  );
}

/** Strip everything but digits. */
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Digits only and a valid number → returned unchanged; anything else → null. */
export function toCanonicalPhone(value: string): string | null {
  if (!/^\d+$/.test(value)) return null;
  return parsePhoneNumberFromString(`+${value}`)?.isValid() ? value : null;
}

/** The country a canonical number belongs to ('996555123456' → 'KG'). */
export function phoneCountry(canonical: string | null | undefined): CountryCode | undefined {
  return canonical ? parsePhoneNumberFromString(`+${canonical}`)?.country : undefined;
}

export function dialCode(country: CountryCode): string {
  return `+${getCountryCallingCode(country)}`;
}

/** Regional-indicator emoji flag for an ISO 3166-1 alpha-2 code. */
export function countryFlag(country: string): string {
  return String.fromCodePoint(
    ...country
      .toUpperCase()
      .split('')
      .map((char) => 0x1f1e6 + char.charCodeAt(0) - 65),
  );
}

export interface PhoneInputState {
  /** Country detected from the number, or the selected one for national input. */
  country?: CountryCode;
  /** Formatted as-you-type value shown in the input. */
  display: string;
  /** Canonical digits ('996555123456') when the number is valid, otherwise ''. */
  canonical: string;
}

/**
 * Resolve raw input (mirrors apps/web/shared/utils/phone.ts):
 * - '+…' is parsed internationally; the country is detected from the calling code.
 * - Anything else is a national number of the selected country. A trunk prefix
 *   ('0555…' in KG, '8916…' in RU) is dropped — the dial code is shown next to the
 *   field — and the rest is grouped like that country's international format
 *   without the code ('555 123 456', '916 123 45 67').
 */
export function resolvePhoneInput(value: string, country?: CountryCode): PhoneInputState {
  const trimmed = value.trim();
  if (!trimmed) return { country, display: '', canonical: '' };

  if (trimmed.startsWith('+') || !country) {
    const typer = new AsYouType();
    const display = typer.input(`+${phoneDigits(trimmed)}`);
    const number = typer.getNumber();
    return {
      country: typer.getCountry() ?? country,
      display,
      canonical: number?.isValid() ? phoneDigits(number.number) : '',
    };
  }

  const national = new AsYouType(country);
  national.input(phoneDigits(trimmed));
  const nationalNumber = national.getNationalNumber();
  if (!nationalNumber) return { country, display: '', canonical: '' };

  const callingCode = getCountryCallingCode(country);
  const typer = new AsYouType();
  const formatted = typer.input(`+${callingCode}${nationalNumber}`);
  const number = typer.getNumber();
  return {
    country,
    display: formatted.slice(`+${callingCode}`.length).trim(),
    canonical: number?.isValid() ? phoneDigits(number.number) : '',
  };
}

/** A stored number as the national part shown next to its dial code ('555 123 456'). */
export function nationalDisplay(canonical: string): string {
  const number = parsePhoneNumberFromString(`+${canonical}`);
  if (!number) return canonical;
  return number.formatInternational().slice(`+${number.countryCallingCode}`.length).trim();
}

/** Canonical digits → international display ('+996 555 123 456'). */
export function formatPhone(canonical: string): string {
  if (!canonical) return '';
  return parsePhoneNumberFromString(`+${canonical}`)?.formatInternational() ?? `+${canonical}`;
}

/** `tel:` link for a canonical phone. */
export function phoneCallUrl(canonical: string): string {
  return `tel:+${canonical}`;
}

/** WhatsApp chat with a canonical phone, optionally with a prefilled message. */
export function whatsappUrl(canonical: string, text?: string): string {
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${canonical}${query}`;
}
