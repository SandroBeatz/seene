import type { MasterPageData } from '#shared/types/master'
import { localeOfPath, resolveLocaleRedirect } from '#shared/utils/masterLocale'

/**
 * Hard locale override for a master's public pages (`/[username]` and
 * `/[username]/book`). The language the master picked in the dashboard
 * (`master_settings.language`) must always win over the visitor's browser
 * locale or the URL prefix.
 *
 * nuxt-i18n-micro derives the active locale strictly from the route in our
 * (non-hash, prefix_except_default) setup — `setLocale()` does not affect
 * rendering. So the only reliable way to force a locale is to redirect to the
 * locale-prefixed equivalent of the requested route. Doing this in a route
 * middleware keeps it SSR-safe: the 302 happens before the page renders, so
 * there is no wrong-language flash.
 *
 * The locale of the *target* route is parsed from `to.path` (see
 * `localeOfPath`) — NOT read from `$getLocale()`, which ignores its argument
 * and returns the global active locale. During the redirect round-trip that
 * active locale lags `to`, so comparing against it never satisfied the
 * "already correct" guard and the middleware looped forever
 * (ERR_TOO_MANY_REDIRECTS). Parsing the path is deterministic and self-
 * consistent with `$localePath`, so the redirect target reads back as the
 * desired locale and the loop terminates after one hop.
 *
 * NOTE: for now we use `master_settings.language`, which is really the
 * dashboard UI language. Once a dedicated B2C language field exists, prefer
 * that and fall back to this one.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const username = to.params.username as string | undefined
  if (!username) return

  const nuxtApp = useNuxtApp()

  // Memoized per username so repeated runs (index ↔ book navigation, the
  // redirect round-trip, client hydration) don't refetch. SSR-populated state
  // transfers to the client via the Nuxt payload.
  const langState = useState<string | null>(`master-lang-${username}`, () => null)

  if (!langState.value) {
    try {
      const data = await $fetch<MasterPageData>(`/api/master/${username}`)
      langState.value = data.settings.language
    } catch {
      // Let the page's own fetch surface the 404 / error.
      return
    }
  }

  const redirect = resolveLocaleRedirect(to.path, username, langState.value)
  if (!redirect) return

  const target = nuxtApp.$localePath(redirect.barePath, redirect.locale)

  // Final guard: never redirect a path onto itself / onto another path that
  // still resolves to the same locale. Protects against any `$localePath`
  // edge case re-introducing a loop.
  if (localeOfPath(target) === localeOfPath(to.path)) return

  return navigateTo(target, { redirectCode: 302 })
})
