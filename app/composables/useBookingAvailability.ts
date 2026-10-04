import type { MaybeRefOrGetter } from 'vue'

export interface AvailabilityDay {
  date: string
  slots: string[]
}

export const BOOKING_DAYS = 30

/**
 * Free slots for the next BOOKING_DAYS days for the selected services, in one
 * request. Cached by Pinia Colada per (master, services), so the booking page
 * can prefetch it while services are being picked and the slots step opens
 * instantly; going back and forth between steps reuses the same entry.
 */
export function useBookingAvailability(
  username: MaybeRefOrGetter<string>,
  serviceIds: MaybeRefOrGetter<string[]>,
  enabled: MaybeRefOrGetter<boolean> = true
) {
  // Order-independent, so picking A then B shares the cache entry with B then A.
  const serviceKey = computed(() => [...toValue(serviceIds)].sort().join(','))

  return useQuery({
    key: () => ['booking-availability', toValue(username), serviceKey.value],
    query: () => {
      const from = formatLocalDate(new Date())
      return $fetch<AvailabilityDay[]>(`/api/master/${toValue(username)}/availability`, {
        query: { from, to: addLocalDays(from, BOOKING_DAYS - 1), service_ids: serviceKey.value }
      })
    },
    enabled: () => Boolean(serviceKey.value) && toValue(enabled),
    staleTime: 30_000
  })
}

export function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function addLocalDays(date: string, days: number) {
  const parsed = new Date(`${date}T00:00:00.000Z`)
  parsed.setUTCDate(parsed.getUTCDate() + days)
  return parsed.toISOString().slice(0, 10)
}

export function parseLocalDate(date: string) {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}
