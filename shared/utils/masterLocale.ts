/**
 * Pure, framework-free helpers backing the `master-locale` route middleware.
 *
 * Kept out of the middleware file so they can be unit-tested without the Nuxt
 * runtime, and — more importantly — so the loop-termination invariant
 * (`localeOfPath(localePrefixed(p, l)) === l`) is covered by tests. A previous
 * version compared against `$getLocale()` (which ignores the route argument and
 * lags the active route during a redirect), producing an infinite redirect loop
 * (ERR_TOO_MANY_REDIRECTS).
 */

export const DEFAULT_LOCALE = 'en'
export const VALID_LOCALES = ['en', 'fr', 'ru'] as const

export type Locale = (typeof VALID_LOCALES)[number]

const LOCALE_PREFIX = /^\/(en|fr|ru)(?=\/|$)/

export function isValidLocale(value: string | null | undefined): value is Locale {
  return value != null && (VALID_LOCALES as readonly string[]).includes(value)
}

/**
 * The locale encoded in a route path under the `prefix_except_default`
 * strategy. A path with no recognised locale prefix is the default locale.
 *
 *   /alice            -> 'en'   (default, no prefix)
 *   /ru/alice         -> 'ru'
 *   /fr/alice/book    -> 'fr'
 */
export function localeOfPath(path: string): Locale {
  const match = path.match(LOCALE_PREFIX)
  return match ? (match[1] as Locale) : DEFAULT_LOCALE
}

/** Whether the path (ignoring any locale prefix) targets the booking page. */
export function isBookPath(path: string): boolean {
  return path.replace(LOCALE_PREFIX, '').replace(/\/+$/, '').endsWith('/book')
}

/** The bare (locale-less) path for a master's public route. */
export function barePathFor(username: string, book: boolean): string {
  return book ? `/${username}/book` : `/${username}`
}

/**
 * Decide whether a redirect is needed to enforce `masterLang` on the given
 * route, and to which bare path. Returns `null` when the route is already in
 * the desired locale (the loop guard) or no enforcement applies.
 */
export function resolveLocaleRedirect(
  path: string,
  username: string,
  masterLang: string | null | undefined
): { barePath: string, locale: Locale } | null {
  if (!isValidLocale(masterLang)) return null
  if (localeOfPath(path) === masterLang) return null
  return { barePath: barePathFor(username, isBookPath(path)), locale: masterLang }
}
