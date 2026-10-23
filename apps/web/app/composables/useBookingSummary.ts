import type { MasterPageData } from '#shared/types/master'

/** The services picked for this booking, with their total time and price, as shown on every step. */
export function useBookingSummary(data: MaybeRefOrGetter<MasterPageData>) {
  const { $ts, getLocale } = useI18n()
  const page = computed(() => toValue(data))
  const bookingState = useBookingState(page.value.profile.username)
  const { formatPrice } = useMasterFormat(() => page.value.settings)
  const { formatDuration } = useMasterPageFormat(() => page.value.settings)

  const services = computed(() =>
    page.value.services.filter((s) => bookingState.value.selectedServiceIds.includes(s.id))
  )
  const duration = computed(() => services.value.reduce((sum, s) => sum + s.duration, 0))
  const price = computed(() => services.value.reduce((sum, s) => sum + priceToNumber(s.price), 0))

  const name = computed(() => services.value.map((s) => s.name).join(' + '))

  const priceLabel = computed(() => {
    const amount = formatPrice(price.value)
    return services.value.some((s) => s.price_from)
      ? $ts('booking.service.priceFrom', { price: amount })
      : amount
  })

  /** "2 h · 800 som" */
  const details = computed(() => `${formatDuration(duration.value)} · ${priceLabel.value}`)

  /** "1 h 30 min · 2 services" */
  const count = computed(() => {
    const n = services.value.length
    const category = new Intl.PluralRules(getLocale()).select(n)
    const key = ['one', 'few', 'many'].includes(category) ? category : 'other'
    return $ts(`booking.service.count.${key}`, { count: n })
  })
  const meta = computed(() => `${formatDuration(duration.value)} · ${count.value}`)
  const durationLabel = computed(() => formatDuration(duration.value))

  return { services, duration, durationLabel, name, priceLabel, details, meta }
}
