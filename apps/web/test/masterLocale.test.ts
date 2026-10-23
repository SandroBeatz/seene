import { describe, it, expect } from 'vitest'
import {
  DEFAULT_LOCALE,
  VALID_LOCALES,
  isValidLocale,
  localeOfPath,
  isBookPath,
  barePathFor,
  resolveLocaleRedirect,
  type Locale
} from '../shared/utils/masterLocale'

/**
 * Mirror of nuxt-i18n-micro's `$localePath` under the `prefix_except_default`
 * strategy, used to assert the loop-termination invariant without the Nuxt
 * runtime. Default locale gets no prefix; others get `/<locale>`.
 */
function localePath(barePath: string, locale: Locale): string {
  return locale === DEFAULT_LOCALE ? barePath : `/${locale}${barePath}`
}

describe('localeOfPath', () => {
  it('treats an unprefixed path as the default locale', () => {
    expect(localeOfPath('/alice')).toBe('en')
    expect(localeOfPath('/alice/book')).toBe('en')
    expect(localeOfPath('/')).toBe('en')
  })

  it('reads the locale prefix when present', () => {
    expect(localeOfPath('/ru/alice')).toBe('ru')
    expect(localeOfPath('/fr/alice/book')).toBe('fr')
    expect(localeOfPath('/en/alice')).toBe('en')
  })

  it('does not treat a username that merely starts with locale letters as a prefix', () => {
    // `/ruth` must NOT be read as the `ru` locale — the prefix requires a
    // boundary (`/` or end of string) right after the locale code.
    expect(localeOfPath('/ruth')).toBe('en')
    expect(localeOfPath('/frankie')).toBe('en')
    expect(localeOfPath('/enzo')).toBe('en')
  })
})

describe('isBookPath', () => {
  it('detects the booking page across locales', () => {
    expect(isBookPath('/alice/book')).toBe(true)
    expect(isBookPath('/ru/alice/book')).toBe(true)
    expect(isBookPath('/fr/alice/book/')).toBe(true)
  })

  it('is false for the profile page', () => {
    expect(isBookPath('/alice')).toBe(false)
    expect(isBookPath('/ru/alice')).toBe(false)
    expect(isBookPath('/booker')).toBe(false) // username, not /book
  })
})

describe('isValidLocale', () => {
  it('accepts configured locales only', () => {
    expect(isValidLocale('en')).toBe(true)
    expect(isValidLocale('ru')).toBe(true)
    expect(isValidLocale('de')).toBe(false)
    expect(isValidLocale(null)).toBe(false)
    expect(isValidLocale(undefined)).toBe(false)
    expect(isValidLocale('')).toBe(false)
  })
})

describe('resolveLocaleRedirect', () => {
  it('returns null when the master language is missing or unsupported', () => {
    expect(resolveLocaleRedirect('/alice', 'alice', null)).toBeNull()
    expect(resolveLocaleRedirect('/alice', 'alice', undefined)).toBeNull()
    expect(resolveLocaleRedirect('/alice', 'alice', 'de')).toBeNull()
  })

  it('returns null when the route is already in the master locale', () => {
    // Default locale, unprefixed path — the original ERR_TOO_MANY_REDIRECTS case.
    expect(resolveLocaleRedirect('/alice', 'alice', 'en')).toBeNull()
    expect(resolveLocaleRedirect('/ru/alice', 'alice', 'ru')).toBeNull()
    expect(resolveLocaleRedirect('/fr/alice/book', 'alice', 'fr')).toBeNull()
  })

  it('redirects to the master locale from a mismatched prefix', () => {
    expect(resolveLocaleRedirect('/alice', 'alice', 'ru')).toEqual({
      barePath: '/alice',
      locale: 'ru'
    })
    expect(resolveLocaleRedirect('/ru/alice', 'alice', 'en')).toEqual({
      barePath: '/alice',
      locale: 'en'
    })
    expect(resolveLocaleRedirect('/fr/alice/book', 'alice', 'ru')).toEqual({
      barePath: '/alice/book',
      locale: 'ru'
    })
  })
})

/**
 * The core regression guard. For every master language and every entry path,
 * applying the redirect and then re-running the middleware logic on the
 * redirect target MUST NOT produce a second redirect. A non-null result on the
 * second pass means an infinite loop (ERR_TOO_MANY_REDIRECTS).
 */
describe('redirect loop termination', () => {
  const usernames = ['alice', 'ruth', 'frankie', 'enzo', 'booker']
  const entryPaths = (u: string) => [
    `/${u}`,
    `/${u}/book`,
    `/en/${u}`,
    `/ru/${u}`,
    `/fr/${u}`,
    `/en/${u}/book`,
    `/ru/${u}/book`,
    `/fr/${u}/book`
  ]

  for (const lang of VALID_LOCALES) {
    for (const username of usernames) {
      for (const path of entryPaths(username)) {
        it(`terminates: lang=${lang} username=${username} path=${path}`, () => {
          const first = resolveLocaleRedirect(path, username, lang)
          if (first === null) return // already correct, no redirect issued

          const target = localePath(first.barePath, first.locale)

          // The redirect target must already be in the desired locale...
          expect(localeOfPath(target)).toBe(lang)
          // ...so a second pass produces NO further redirect.
          expect(resolveLocaleRedirect(target, username, lang)).toBeNull()
        })
      }
    }
  }
})

describe('barePathFor', () => {
  it('builds locale-less paths', () => {
    expect(barePathFor('alice', false)).toBe('/alice')
    expect(barePathFor('alice', true)).toBe('/alice/book')
  })
})
