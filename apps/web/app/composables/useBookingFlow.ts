export const BOOKING_STEPS = ['services', 'time', 'details', 'done'] as const
export type BookingStep = (typeof BOOKING_STEPS)[number]

/**
 * Booking opens over the master page; the step lives in the URL (`?book=time`),
 * so the browser Back button walks back through the steps and a shared link
 * opens the booking. Each step forward is a history entry; closing goes back
 * past all of them, so Back after closing does not reopen the booking.
 */
export function useBookingFlow(username: MaybeRefOrGetter<string>) {
  const route = useRoute()
  const router = useRouter()
  // History position of the page entry the booking was opened from; null when
  // the booking was opened by a link (nothing of ours to go back to).
  const basePosition = useState<number | null>(`booking-base:${toValue(username)}`, () => null)

  const step = computed<BookingStep | null>(() => {
    const value = route.query.book
    if (value === '1') return 'services'
    return BOOKING_STEPS.includes(value as BookingStep) ? (value as BookingStep) : null
  })

  const stepNumber = computed(() => (step.value ? BOOKING_STEPS.indexOf(step.value) + 1 : 0))

  function queryFor(next: BookingStep | null) {
    const { book: _book, ...rest } = route.query
    return next ? { ...rest, book: next } : rest
  }

  function position(): number | null {
    if (!import.meta.client) return null
    const value = (window.history.state as { position?: unknown } | null)?.position
    return typeof value === 'number' ? value : null
  }

  /** Steps pushed on top of the page entry that are still behind us. */
  function stepsAbove() {
    const current = position()
    return basePosition.value === null || current === null ? 0 : current - basePosition.value
  }

  function goTo(next: BookingStep) {
    if (next === step.value) return
    if (!step.value) basePosition.value = position()
    return router.push({ query: queryFor(next) })
  }

  /** Same step change without a history entry (e.g. fixing an invalid step). */
  function replace(next: BookingStep | null) {
    return router.replace({ query: queryFor(next) })
  }

  function back(): void {
    if (stepsAbove() > 0) {
      router.back()
      return
    }
    const index = step.value ? BOOKING_STEPS.indexOf(step.value) : 0
    void replace(index > 0 ? BOOKING_STEPS[index - 1]! : null)
  }

  function close(): void {
    const entries = stepsAbove()
    basePosition.value = null
    if (entries > 0) {
      router.go(-entries)
      return
    }
    void replace(null)
  }

  return { step, stepNumber, goTo, replace, back, close }
}
