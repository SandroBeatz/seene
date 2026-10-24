import {
  MARKET_COOKIE,
  isMarket,
  marketOfCountry,
  marketOfLocale,
  type Market,
  type PriceMarket
} from '#shared/utils/market'

type MarketState = {
  market: Market | null
  /** `ip`: from the CDN's country, `chosen`: the visitor picked it, `default`: a guess */
  source: 'default' | 'ip' | 'chosen'
}

let detecting: Promise<void> | null = null

/**
 * The visitor's market for prices, currency on the app screens and the
 * founders form. The marketing pages are prerendered, so they render the
 * language's guess (`marketOfLocale`) and, once in the browser, take the
 * visitor's own choice (cookie) or the IP country (`GET /api/country`).
 */
export function useMarket() {
  const { getLocale } = useI18n()
  const state = useState<MarketState>('market', () => ({ market: null, source: 'default' }))
  const cookie = useCookie<string | null>(MARKET_COOKIE, {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  })

  const market = computed<Market>(() => state.value.market ?? marketOfLocale(getLocale()))
  /** Prices and currency: another country sees the language's guess */
  const priceMarket = computed<PriceMarket>(() =>
    market.value === 'other' ? marketOfLocale(getLocale()) : market.value
  )

  function choose(value: Market) {
    state.value = { market: value, source: 'chosen' }
    cookie.value = value
  }

  onMounted(() => {
    if (state.value.source !== 'default') return
    if (isMarket(cookie.value)) {
      state.value = { market: cookie.value, source: 'chosen' }
      return
    }
    detecting ??= $fetch<{ country: string | null }>('/api/country')
      .then(({ country }) => {
        // Unknown country (local dev, no CDN header): keep the guess
        if (country && state.value.source === 'default') {
          state.value = { market: marketOfCountry(country), source: 'ip' }
        }
      })
      .catch(() => {})
  })

  return { market, priceMarket, source: computed(() => state.value.source), choose }
}
