/**
 * Sums on the homepage's app screens in the visitor's currency (sitemap: som
 * for Kyrgyzstan, $ for Canada). Each amount is `[som, CAD]`, both realistic
 * for the market: "48 200 сом" or "$3,400".
 */
export function useHomeMoney() {
  const { $ts, getLocale } = useI18n()
  const { priceMarket } = useMarket()

  const money = (amount: readonly [number, number], sign = '') => {
    if (priceMarket.value === 'kg') {
      return `${sign}${new Intl.NumberFormat(getLocale()).format(amount[0])} ${$ts('app.currency')}`
    }
    const cad = new Intl.NumberFormat(getLocale(), {
      style: 'currency',
      currency: 'CAD',
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0
    })
    return `${sign}${cad.format(amount[1])}`
  }

  return { money, market: priceMarket }
}
