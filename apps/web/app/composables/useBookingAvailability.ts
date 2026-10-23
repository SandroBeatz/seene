import type { MaybeRefOrGetter } from 'vue'

export interface AvailabilityDay {
  date: string
  slots: string[]
}

/**
 * Free slots for the selected service over the master's booking horizon (the
 * server counts it from today in her time zone), in one request. Cached by
 * Pinia Colada per (master, service), so the time step can be prefetched and
 * going back and forth between steps reuses the same entry.
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
    query: () =>
      $fetch<AvailabilityDay[]>(`/api/master/${toValue(username)}/availability`, {
        query: { service_ids: serviceKey.value }
      }),
    enabled: () => Boolean(serviceKey.value) && toValue(enabled),
    staleTime: 30_000
  })
}

export function parseLocalDate(date: string) {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}
