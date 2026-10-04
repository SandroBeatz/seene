import { describe, it, expect } from 'vitest'
import { countryFlag, resolvePhoneInput, toE164, toPhoneCountry } from '../shared/utils/phone'

describe('toE164', () => {
  it('normalizes formatted international input', () => {
    expect(toE164('+996 (555) 12-34-56')).toBe('+996555123456')
  })

  it('uses the default country for national input with a trunk prefix', () => {
    expect(toE164('0555 123 456', 'KG')).toBe('+996555123456')
    expect(toE164('8 916 123-45-67', 'RU')).toBe('+79161234567')
  })

  it('rejects invalid numbers', () => {
    expect(toE164('+996 555')).toBeNull()
    expect(toE164('hello')).toBeNull()
  })
})

describe('resolvePhoneInput', () => {
  it('detects the country from an international number', () => {
    const state = resolvePhoneInput('+33612345678', 'KG')
    expect(state.country).toBe('FR')
    expect(state.e164).toBe('+33612345678')
  })

  it('keeps incomplete input visible without exposing a value', () => {
    const state = resolvePhoneInput('555 12', 'KG')
    expect(state.display).not.toBe('')
    expect(state.e164).toBe('')
  })

  it('treats national input as the selected country', () => {
    expect(resolvePhoneInput('555123456', 'KG').e164).toBe('+996555123456')
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
