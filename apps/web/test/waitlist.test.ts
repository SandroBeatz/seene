import { describe, it, expect } from 'vitest'
import { parseWaitlistInput } from '../shared/utils/waitlist'
import { marketOfCountry, marketOfLocale } from '../shared/utils/market'

const valid = {
  name: ' Vika ',
  contact: ' @vika.nails ',
  country: 'kg',
  city: ' Osh ',
  specialty: ' nails, brows '
}

describe('parseWaitlistInput', () => {
  it('trims a valid application', () => {
    expect(parseWaitlistInput(valid)).toEqual({
      name: 'Vika',
      contact: '@vika.nails',
      country: 'kg',
      city: 'Osh',
      place: null,
      specialty: 'nails, brows'
    })
  })

  it('rejects a missing or too long name or contact', () => {
    expect(parseWaitlistInput({ ...valid, name: '  ' })).toBeNull()
    expect(parseWaitlistInput({ ...valid, name: 'a'.repeat(61) })).toBeNull()
    expect(parseWaitlistInput({ ...valid, contact: 'a' })).toBeNull()
    expect(parseWaitlistInput({ ...valid, contact: 'a'.repeat(101) })).toBeNull()
    expect(parseWaitlistInput({ ...valid, name: 42 })).toBeNull()
  })

  it('rejects a missing, too short or too long specialty', () => {
    expect(parseWaitlistInput({ ...valid, specialty: ' ' })).toBeNull()
    expect(parseWaitlistInput({ ...valid, specialty: 'a' })).toBeNull()
    expect(parseWaitlistInput({ ...valid, specialty: 'a'.repeat(101) })).toBeNull()
    expect(parseWaitlistInput({ ...valid, specialty: ['nails'] })).toBeNull()
  })

  it('takes the city as typed for Kyrgyzstan and Canada', () => {
    expect(parseWaitlistInput({ ...valid, country: 'ca', city: ' Hamilton ' })).toMatchObject({
      country: 'ca',
      city: 'Hamilton',
      place: null
    })
    expect(parseWaitlistInput({ ...valid, city: 'a' })).toBeNull()
    expect(parseWaitlistInput({ ...valid, city: 'a'.repeat(101) })).toBeNull()
    expect(parseWaitlistInput({ ...valid, city: undefined })).toBeNull()
    expect(parseWaitlistInput({ ...valid, country: 'kz' })).toBeNull()
  })

  it('takes "country and city" as text for another country', () => {
    expect(
      parseWaitlistInput({ ...valid, country: 'other', city: 'osh', place: ' Almaty, KZ ' })
    ).toMatchObject({ country: 'other', city: null, place: 'Almaty, KZ' })
    expect(parseWaitlistInput({ ...valid, country: 'other', place: 'A' })).toBeNull()
    expect(parseWaitlistInput({ ...valid, country: 'other', place: 'a'.repeat(101) })).toBeNull()
  })
})

describe('markets', () => {
  it('maps the IP country to a market', () => {
    expect(marketOfCountry('KG')).toBe('kg')
    expect(marketOfCountry('ca')).toBe('ca')
    expect(marketOfCountry('KZ')).toBe('other')
    expect(marketOfCountry(null)).toBe('other')
  })

  it('guesses prices from the language until the country is known', () => {
    expect(marketOfLocale('ru')).toBe('kg')
    expect(marketOfLocale('en')).toBe('ca')
    expect(marketOfLocale('fr')).toBe('ca')
  })
})
