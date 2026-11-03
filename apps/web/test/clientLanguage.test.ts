import { describe, expect, it } from 'vitest'
import { clientLanguageFromHeader } from '../server/utils/clientLanguage'

describe('clientLanguageFromHeader', () => {
  it('takes the first language messages exist in', () => {
    expect(clientLanguageFromHeader('ky-KG,ru;q=0.9,en;q=0.8')).toBe('ru')
    expect(clientLanguageFromHeader('fr-FR')).toBe('fr')
  })

  it('follows the quality, not the order', () => {
    expect(clientLanguageFromHeader('en;q=0.5,ru;q=0.9')).toBe('ru')
  })

  it('knows nothing without a supported language', () => {
    expect(clientLanguageFromHeader('de,ky')).toBeNull()
    expect(clientLanguageFromHeader(undefined)).toBeNull()
  })
})
