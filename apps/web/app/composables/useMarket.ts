import {
  marketOfCountry,
  marketOfLocale,
  type Market,
  type PriceMarket
} from '#shared/utils/market'

let detecting: Promise<void> | null = null

/**
 * The visitor's market for prices, currency on the app screens and the
 * founders form's cities. Nothing on the site shows or switches it. The
 * marketing pages are prerendered, so they render the language's guess
 * (`marketOfLocale`) and, once in the browser, take the IP country from
 * `GET /api/country`.
 */
export function useMarket() {
  const { getLocale } = useI18n()
  const detected = useState<Market | null>('market', () => null)

  const market = computed<Market>(() => detected.value ?? marketOfLocale(getLocale()))
  /** Prices and currency: another country sees the language's guess */
  const priceMarket = computed<PriceMarket>(() =>
    market.value === 'other' ? marketOfLocale(getLocale()) : market.value
  )

  onMounted(() => {
    detecting ??= $fetch<{ country: string | null }>('/api/country')
      .then(({ country }) => {
        // Unknown country (local dev, no CDN header): keep the guess
        if (country) detected.value = marketOfCountry(country)
      })
      .catch(() => {})
  })

  return { market, priceMarket }
}
