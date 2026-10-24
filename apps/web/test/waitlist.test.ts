import { describe, it, expect } from 'vitest'
import { parseWaitlistInput } from '../shared/utils/waitlist'

const valid = {
  name: ' Karina ',
  contact: ' @karina.nails ',
  city: 'bishkek',
  specialty: ' nails, brows '
}

describe('parseWaitlistInput', () => {
  it('trims a valid application', () => {
    expect(parseWaitlistInput(valid)).toEqual({
      name: 'Karina',
      contact: '@karina.nails',
      city: 'bishkek',
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

  it('rejects an unknown city', () => {
    expect(parseWaitlistInput({ ...valid, city: 'moscow' })).toBeNull()
  })
})
