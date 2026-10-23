/**
 * Currency catalogue used for price formatting on the public master site.
 *
 * Mirrors the dashboard (master.seene): currency is an app-level setting that is
 * intentionally INDEPENDENT of the UI locale — a master in Kyrgyzstan using the
 * English interface still wants prices in `сом`. So we carry the symbol and its
 * `position` here and format prices manually instead of relying on `Intl`
 * currency formatting, which would pick symbol/position from the locale.
 *
 * `decimals` is the default number of fraction digits for the currency. CIS
 * currencies are commonly displayed without minor units (0), western ones with 2.
 */
export interface CurrencyOption {
  /** ISO 4217 code, e.g. 'KGS'. */
  code: string
  /** Display symbol, e.g. '₸', 'сом', '$'. */
  symbol: string
  /** Where the symbol sits relative to the amount. */
  position: 'prefix' | 'suffix'
  /** Default fraction digits used when formatting prices. */
  decimals: number
  /** Human-readable name for selects. */
  label: string
}

/** Curated list: CIS + USA + Canada + EUR. KGS (сом, Kyrgyzstan) is mandatory. */
export const CURRENCIES: CurrencyOption[] = [
  { code: 'KGS', symbol: 'сом', position: 'suffix', decimals: 0, label: 'Kyrgyzstani som (KGS)' },
  { code: 'KZT', symbol: '₸', position: 'suffix', decimals: 0, label: 'Kazakhstani tenge (KZT)' },
  { code: 'RUB', symbol: '₽', position: 'suffix', decimals: 0, label: 'Russian ruble (RUB)' },
  { code: 'UZS', symbol: "so'm", position: 'suffix', decimals: 0, label: 'Uzbekistani som (UZS)' },
  { code: 'UAH', symbol: '₴', position: 'suffix', decimals: 0, label: 'Ukrainian hryvnia (UAH)' },
  { code: 'AMD', symbol: '֏', position: 'suffix', decimals: 0, label: 'Armenian dram (AMD)' },
  { code: 'AZN', symbol: '₼', position: 'suffix', decimals: 2, label: 'Azerbaijani manat (AZN)' },
  { code: 'GEL', symbol: '₾', position: 'suffix', decimals: 2, label: 'Georgian lari (GEL)' },
  { code: 'BYN', symbol: 'Br', position: 'suffix', decimals: 2, label: 'Belarusian ruble (BYN)' },
  {
    code: 'TJS',
    symbol: 'смн',
    position: 'suffix',
    decimals: 2,
    label: 'Tajikistani somoni (TJS)'
  },
  { code: 'TMT', symbol: 'm', position: 'suffix', decimals: 2, label: 'Turkmenistani manat (TMT)' },
  { code: 'MDL', symbol: 'L', position: 'suffix', decimals: 2, label: 'Moldovan leu (MDL)' },
  { code: 'USD', symbol: '$', position: 'prefix', decimals: 2, label: 'US dollar (USD)' },
  { code: 'CAD', symbol: 'C$', position: 'prefix', decimals: 2, label: 'Canadian dollar (CAD)' },
  { code: 'EUR', symbol: '€', position: 'prefix', decimals: 2, label: 'Euro (EUR)' }
]

/** Default currency code — mirrors the master_settings.currency column default. */
export const DEFAULT_CURRENCY_CODE = 'USD'

const CURRENCY_BY_CODE = new Map(CURRENCIES.map((currency) => [currency.code, currency]))

/** Looks up a currency by ISO code. Returns undefined for unknown codes. */
export function getCurrency(code: string): CurrencyOption | undefined {
  return CURRENCY_BY_CODE.get(code)
}
