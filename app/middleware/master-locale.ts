import type { MasterPageData } from '#shared/types/master'

const VALID_LOCALES = ['en', 'fr', 'ru']
const LOCALE_PREFIX = /^\/(en|fr|ru)(?=\/|$)/

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

  const lang = langState.value
  if (!lang || !VALID_LOCALES.includes(lang)) return

  // Already on the master's locale — nothing to do (also breaks the redirect loop).
  if (nuxtApp.$getLocale(to) === lang) return

  const isBook = to.path.replace(LOCALE_PREFIX, '').endsWith('/book')
  const barePath = isBook ? `/${username}/book` : `/${username}`

  return navigateTo(nuxtApp.$localePath(barePath, lang), { redirectCode: 302 })
})
