import type { MaybeRefOrGetter } from 'vue'
import type { MasterPageData } from '#shared/types/master'

/**
 * Shared query for a master's public page data (profile + settings + services +
 * payment types). Keyed by username so every component on the master/booking
 * routes — the page and any nested step — reads the same Pinia Colada cache
 * entry instead of refetching or drilling props.
 */
export function useMasterData(username: MaybeRefOrGetter<string>) {
  return useQuery({
    key: () => ['master', toValue(username)],
    query: () => $fetch<MasterPageData>(`/api/master/${toValue(username)}`)
  })
}
