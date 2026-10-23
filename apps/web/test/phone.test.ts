import { describe, it, expect } from 'vitest'
import {
  countryFlag,
  formatPhone,
  resolvePhoneInput,
  toCanonicalPhone,
  toPhoneCountry
} from '../shared/utils/phone'

describe('toCanonicalPhone', () => {
  it('accepts valid canonical digits unchanged', () => {
    expect(toCanonicalPhone('996555123456')).toBe('996555123456')
    expect(toCanonicalPhone('79161234567')).toBe('79161234567')
  })

  it('rejects anything that is not canonical digits', () => {
    expect(toCanonicalPhone('+996555123456')).toBeNull()
    expect(toCanonicalPhone('+996 (555) 12-34-56')).toBeNull()
    expect(toCanonicalPhone('0555123456')).toBeNull()
  })

  it('rejects invalid numbers', () => {
    expect(toCanonicalPhone('996555')).toBeNull()
    expect(toCanonicalPhone('hello')).toBeNull()
  })
})

describe('formatPhone', () => {
  it('formats canonical digits for display', () => {
    expect(formatPhone('996555123456')).toBe('+996 555 123 456')
    expect(formatPhone('')).toBe('')
  })
})

describe('resolvePhoneInput', () => {
  it('detects the country from an international number', () => {
    const state = resolvePhoneInput('+33612345678', 'KG')
    expect(state.country).toBe('FR')
    expect(state.canonical).toBe('33612345678')
  })

  it('keeps incomplete input visible without exposing a value', () => {
    const state = resolvePhoneInput('555 12', 'KG')
    expect(state.display).not.toBe('')
    expect(state.canonical).toBe('')
  })

  it('treats national input as the selected country', () => {
    expect(resolvePhoneInput('555123456', 'KG').canonical).toBe('996555123456')
  })

  it('drops the trunk prefix of national input', () => {
    expect(resolvePhoneInput('0555 123 456', 'KG').canonical).toBe('996555123456')
    expect(resolvePhoneInput('8 916 123-45-67', 'RU').canonical).toBe('79161234567')
  })
})

describe('helpers', () => {
  it('validates country codes', () => {
    expect(toPhoneCountry('kg')).toBe('KG')
    expect(toPhoneCountry('XX')).toBeUndefined()
  })

  it('builds emoji flags', () => {
    expect(countryFlag('KG')).toBe('🇰🇬')
  })
})
