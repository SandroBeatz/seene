/**
 * Currencies offered by the onboarding / settings picker (design order), each with
 * the one-glyph mark shown in its round badge. Names come from i18n
 * (`currencies.<code>`); a phone currency outside this list is added to it.
 */
export interface CurrencyOption {
  /** ISO 4217. */
  code: string;
  glyph: string;
}

export const CURRENCIES: readonly CurrencyOption[] = [
  { code: 'KGS', glyph: 'с' },
  { code: 'CAD', glyph: '$' },
  { code: 'USD', glyph: '$' },
  { code: 'EUR', glyph: '€' },
  { code: 'KZT', glyph: '₸' },
  { code: 'RUB', glyph: '₽' },
];

/** The design's list, plus `extra` (the phone's currency) when it is missing. */
export function currencyOptions(extra?: string): CurrencyOption[] {
  if (!extra || CURRENCIES.some((c) => c.code === extra)) return [...CURRENCIES];
  return [...CURRENCIES, { code: extra, glyph: extra.slice(0, 1) }];
}
