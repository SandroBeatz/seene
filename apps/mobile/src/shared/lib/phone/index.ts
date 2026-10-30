/**
 * Phone display helpers. Canonical format everywhere is E.164 digits without "+"
 * ('996555123456', see the repo AGENTS.md); formatting is display-only. Mirrors
 * apps/web/shared/utils/phone.ts.
 */
import { parsePhoneNumberFromString } from 'libphonenumber-js';

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
