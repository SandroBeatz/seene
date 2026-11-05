import type { MaybeRefOrGetter } from 'vue'
import type { MasterPageData } from '#shared/types/master'

/**
 * Shared query for a master's public page data (profile + settings + services +
 * payment types). Keyed by username so every component on the master/booking
 * routes — the page and any nested step — reads the same Pinia Colada cache
 * entry instead of refetching or drilling props.
 *
 * People load it in the browser behind the skeleton, so the first paint doesn't
 * wait for the database. Crawlers don't run JavaScript: the server loads it for
 * them, for the link preview and search.
 */
export function useMasterData(username: MaybeRefOrGetter<string>) {
  const enabled = import.meta.client || isCrawler(useRequestHeader('user-agent'))

  return useQuery({
    key: () => ['master', toValue(username)],
    query: () => $fetch<MasterPageData>(`/api/master/${toValue(username)}`),
    enabled
  })
}

/**
 * The language the master picked (`master_settings.language`) must win over the
 * URL. Waits for the page's data, then moves to the right prefix keeping the query
 * (`?book=…`). False until the URL is right, so the page keeps its skeleton and
 * never shows the wrong language. Crawlers are redirected by the `master-locale`
 * middleware before rendering.
 */
export function useMasterLocale(
  username: MaybeRefOrGetter<string>,
  data: Ref<MasterPageData | undefined>
) {
  const route = useRoute()
  const { $localePath } = useI18n()

  const redirect = computed(() =>
    data.value
      ? resolveLocaleRedirect(route.path, toValue(username), data.value.settings.language)
      : null
  )

  watch(
    redirect,
    (target) => {
      if (!target || import.meta.server) return

      const path = $localePath(target.barePath, target.locale)
      // Never redirect onto a path in the same locale: protects against a loop.
      if (localeOfPath(path) === localeOfPath(route.path)) return

      return navigateTo({ path, query: route.query, hash: route.hash }, { replace: true })
    },
    { immediate: true }
  )

  return computed(() => !!data.value && !redirect.value)
}
