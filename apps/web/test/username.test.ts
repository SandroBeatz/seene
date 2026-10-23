import { describe, it, expect } from 'vitest'
import { isValidUsername } from '../shared/utils/username'

describe('isValidUsername', () => {
  it('accepts lowercase letters, digits, underscores and hyphens', () => {
    expect(isValidUsername('aigul')).toBe(true)
    expect(isValidUsername('alex-beats')).toBe(true)
    expect(isValidUsername('nails_by_dina')).toBe(true)
    expect(isValidUsername('studio42')).toBe(true)
  })

  it('rejects dots, uppercase and other symbols', () => {
    expect(isValidUsername('aigul.nails')).toBe(false)
    expect(isValidUsername('Aigul')).toBe(false)
    expect(isValidUsername('aigul nails')).toBe(false)
    expect(isValidUsername('айгуль')).toBe(false)
  })

  it('needs 3-30 characters starting with a letter or digit', () => {
    expect(isValidUsername('ab')).toBe(false)
    expect(isValidUsername('a'.repeat(30))).toBe(true)
    expect(isValidUsername('a'.repeat(31))).toBe(false)
    expect(isValidUsername('_aigul')).toBe(false)
    expect(isValidUsername('-aigul')).toBe(false)
  })

  it('rejects paths of the site', () => {
    expect(isValidUsername('pricing')).toBe(false)
    expect(isValidUsername('privacy')).toBe(false)
    expect(isValidUsername('api')).toBe(false)
  })
})
