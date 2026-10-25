/**
 * The visitor's market (sitemap, "Страна посетителя"): Kyrgyzstan (som),
 * Canada (CAD), or another country. It comes from the CDN's IP country
 * (`cf-ipcountry` on Cloudflare, `x-vercel-ip-country` on Vercel). The site
 * neither shows nor switches it.
 */

export const MARKETS = ['kg', 'ca', 'other'] as const
export type Market = (typeof MARKETS)[number]

/** Markets with their own prices and currency */
export type PriceMarket = Exclude<Market, 'other'>

/** Cities of the founders form, in the design's order; `other` is last */
export const MARKET_CITIES = {
  kg: ['bishkek', 'osh', 'jalal-abad', 'karakol', 'tokmok', 'kara-balta', 'other'],
  ca: ['toronto', 'vancouver', 'montreal', 'calgary', 'ottawa', 'edmonton', 'mississauga', 'other']
} as const satisfies Record<PriceMarket, readonly string[]>

export type MarketCity<M extends PriceMarket = PriceMarket> = (typeof MARKET_CITIES)[M][number]

export function isMarket(value: unknown): value is Market {
  return MARKETS.includes(value as Market)
}

/** Two-letter country code (any case) to a market. */
export function marketOfCountry(code: string | null | undefined): Market {
  const country = code?.toUpperCase()
  if (country === 'KG') return 'kg'
  if (country === 'CA') return 'ca'
  return 'other'
}

/**
 * The market to show before the country is known, and the prices for "another
 * country": Russian readers most likely come from Kyrgyzstan, others from Canada.
 */
export function marketOfLocale(locale: string): PriceMarket {
  return locale === 'ru' ? 'kg' : 'ca'
}
