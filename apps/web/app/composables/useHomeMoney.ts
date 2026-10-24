/** Sums on the homepage's app screens: "48 200 сом" in the page's language. */
export function useHomeMoney() {
  const { $ts, getLocale } = useI18n()

  return (value: number, sign = '') =>
    `${sign}${new Intl.NumberFormat(getLocale()).format(value)} ${$ts('app.currency')}`
}
