import { SITE_LOCALE_COOKIE } from '#shared/utils/siteLocale'

/** Keeps the language the visitor picked on the marketing site (one year). */
export function useSiteLocale() {
  const saved = useCookie<string | null>(SITE_LOCALE_COOKIE, {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/'
  })

  function rememberLocale(code: string) {
    saved.value = code
  }

  return { rememberLocale }
}
