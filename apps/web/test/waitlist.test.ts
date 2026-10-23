import { describe, it, expect } from 'vitest'
import { parseWaitlistInput } from '../shared/utils/waitlist'

const valid = {
  name: ' Aigul ',
  contact: ' @aigul.nails ',
  city: 'bishkek',
  specialties: ['manicure', 'brows']
}

describe('parseWaitlistInput', () => {
  it('trims a valid application', () => {
    expect(parseWaitlistInput(valid)).toEqual({
      name: 'Aigul',
      contact: '@aigul.nails',
      city: 'bishkek',
      specialties: ['manicure', 'brows']
    })
  })

  it('keeps only known specialties, in a fixed order, without repeats', () => {
    expect(
      parseWaitlistInput({ ...valid, specialties: ['lashes', 'nails', 'manicure', 'lashes'] })
        ?.specialties
    ).toEqual(['manicure', 'lashes'])
  })

  it('rejects a missing or too long name or contact', () => {
    expect(parseWaitlistInput({ ...valid, name: '  ' })).toBeNull()
    expect(parseWaitlistInput({ ...valid, name: 'a'.repeat(61) })).toBeNull()
    expect(parseWaitlistInput({ ...valid, contact: 'a' })).toBeNull()
    expect(parseWaitlistInput({ ...valid, contact: 'a'.repeat(101) })).toBeNull()
    expect(parseWaitlistInput({ ...valid, name: 42 })).toBeNull()
  })

  it('rejects an unknown city or no known specialty', () => {
    expect(parseWaitlistInput({ ...valid, city: 'moscow' })).toBeNull()
    expect(parseWaitlistInput({ ...valid, specialties: ['nails'] })).toBeNull()
    expect(parseWaitlistInput({ ...valid, specialties: 'manicure' })).toBeNull()
  })
})
