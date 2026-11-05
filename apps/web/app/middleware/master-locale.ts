import type { MasterPageData } from '#shared/types/master'
import { localeOfPath, resolveLocaleRedirect } from '#shared/utils/masterLocale'

/**
 * Locale and status code of a master's page for crawlers, which read the first
 * response only: a 302 to the master's language and a real 404. People get the
 * page's skeleton at once, and `useMasterLocale` moves them to the right language
 * in the browser: a database request here would hold up their first paint.
 *
 * The locale of the *target* route is parsed from `to.path` (see `localeOfPath`) —
 * NOT read from `$getLocale()`, which ignores its argument and returns the global
 * active locale. During the redirect round-trip that active locale lags `to`, so
 * comparing against it never satisfied the "already correct" guard and the
 * middleware looped forever (ERR_TOO_MANY_REDIRECTS).
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.client || !isCrawler(useRequestHeader('user-agent'))) return

  const username = to.params.username as string | undefined
  if (!username) return

  let language: string
  try {
    const data = await $fetch<MasterPageData>(`/api/master/${username}`)
    language = data.settings.language
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 404) {
      return abortNavigation(createError({ statusCode: 404, fatal: true }))
    }
    return
  }

  const redirect = resolveLocaleRedirect(to.path, username, language)
  if (!redirect) return

  const target = useNuxtApp().$localePath(redirect.barePath, redirect.locale)
  if (localeOfPath(target) === localeOfPath(to.path)) return

  return navigateTo(target, { redirectCode: 302 })
})
