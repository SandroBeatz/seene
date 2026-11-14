import { describe, it, expect } from 'vitest'
import { isSitePath, localeOfTimeZone, resolveSiteLocale } from '../shared/utils/siteLocale'

describe('localeOfTimeZone', () => {
  it('maps CIS zones to ru', () => {
    expect(localeOfTimeZone('Asia/Bishkek')).toBe('ru')
    expect(localeOfTimeZone('Europe/Moscow')).toBe('ru')
    expect(localeOfTimeZone('Asia/Almaty')).toBe('ru')
  })

  it('maps French zones to fr', () => {
    expect(localeOfTimeZone('Europe/Paris')).toBe('fr')
    expect(localeOfTimeZone('Indian/Reunion')).toBe('fr')
  })

  it('falls back to en', () => {
    expect(localeOfTimeZone('America/Toronto')).toBe('en')
    expect(localeOfTimeZone('UTC')).toBe('en')
    expect(localeOfTimeZone(undefined)).toBe('en')
  })
})

describe('isSitePath', () => {
  it('knows marketing pages with or without a prefix', () => {
    expect(isSitePath('/')).toBe(true)
    expect(isSitePath('/pricing')).toBe(true)
    expect(isSitePath('/ru')).toBe(true)
    expect(isSitePath('/fr/terms/')).toBe(true)
  })

  it('leaves master pages and booking links alone', () => {
    expect(isSitePath('/alice')).toBe(false)
    expect(isSitePath('/ru/alice/book')).toBe(false)
    expect(isSitePath('/c/abc')).toBe(false)
  })
})

describe('resolveSiteLocale', () => {
  it('uses the time zone, not the browser language, on an unprefixed page', () => {
    expect(resolveSiteLocale('/', null, 'Asia/Bishkek')).toBe('ru')
    expect(resolveSiteLocale('/pricing', null, 'Europe/Paris')).toBe('fr')
    expect(resolveSiteLocale('/', null, 'America/Toronto')).toBeNull()
  })

  it('prefers the saved choice over the time zone', () => {
    expect(resolveSiteLocale('/', 'en', 'Asia/Bishkek')).toBeNull()
    expect(resolveSiteLocale('/', 'fr', 'Asia/Bishkek')).toBe('fr')
  })

  it('ignores an invalid saved value', () => {
    expect(resolveSiteLocale('/', 'de', 'Asia/Bishkek')).toBe('ru')
  })

  it('keeps an explicit locale prefix from a link', () => {
    expect(resolveSiteLocale('/ru/pricing', 'en', 'America/Toronto')).toBeNull()
    expect(resolveSiteLocale('/fr', null, 'Asia/Bishkek')).toBeNull()
  })

  it('never touches master pages', () => {
    expect(resolveSiteLocale('/alice', 'ru', 'Asia/Bishkek')).toBeNull()
  })
})
