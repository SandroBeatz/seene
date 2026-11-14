import { SITE_LOCALE_COOKIE, resolveSiteLocale } from '#shared/utils/siteLocale'

/**
 * Puts a visitor of the marketing site on their language once the page is in the
 * browser: the language picked earlier (cookie), else the device time zone.
 * The pages are prerendered in English, and the time zone is known only here.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    const route = useRoute()
    const saved = useCookie<string | null>(SITE_LOCALE_COOKIE).value

    let timeZone: string | undefined
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      timeZone = undefined
    }

    const locale = resolveSiteLocale(route.path, saved, timeZone)
    if (!locale) return

    const switchLocalePath = nuxtApp.$switchLocalePath as (code: string) => string
    const target = switchLocalePath(locale)
    if (target && target !== route.path) {
      navigateTo({ path: target, query: route.query, hash: route.hash }, { replace: true })
    }
  })
})
