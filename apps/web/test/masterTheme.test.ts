import { describe, it, expect } from 'vitest'
import {
  ACCENT_PRESETS,
  contrastRatio,
  masterPalette,
  mix,
  resolveAccent,
  resolvePageTheme
} from '../shared/utils/masterTheme'

describe('resolveAccent', () => {
  it('maps a preset key to its color', () => {
    expect(resolveAccent('lavender')).toBe('#6D5DD3')
  })

  it('accepts a custom #RRGGBB color', () => {
    expect(resolveAccent('#12ab9f')).toBe('#12AB9F')
  })

  it('falls back to rose for anything else', () => {
    expect(resolveAccent(null)).toBe('#CF3767')
    expect(resolveAccent('pink')).toBe('#CF3767')
    expect(resolveAccent('#abc')).toBe('#CF3767')
  })
})

describe('resolvePageTheme', () => {
  it('is light unless dark is set', () => {
    expect(resolvePageTheme('dark')).toBe('dark')
    expect(resolvePageTheme(null)).toBe('light')
    expect(resolvePageTheme('auto')).toBe('light')
  })
})

describe('contrastRatio', () => {
  it('matches WCAG for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5)
  })
})

describe('masterPalette', () => {
  it('keeps text on the accent readable for every preset, in both themes', () => {
    for (const accent of Object.keys(ACCENT_PRESETS)) {
      for (const theme of ['light', 'dark'] as const) {
        const p = masterPalette(theme, accent)
        expect(contrastRatio(p.onAccent, p.accent), `${accent} ${theme}`).toBeGreaterThanOrEqual(
          4.5
        )
      }
    }
  })

  it('puts white text on rose and dark text on gold', () => {
    expect(masterPalette('light', 'rose').onAccent).toBe('#FFFFFF')
    expect(masterPalette('light', 'gold').onAccent).toBe('#0B0B0C')
  })

  it('handles a very light custom color', () => {
    const p = masterPalette('light', '#F5E6A8')
    expect(p.onAccent).toBe('#0B0B0C')
    // Light accents are darkened for links on white.
    expect(contrastRatio(p.accentText, p.bg)).toBeGreaterThan(contrastRatio(p.accent, p.bg))
  })

  it('lightens a dark accent for links on the dark theme', () => {
    const p = masterPalette('dark', 'black')
    expect(contrastRatio(p.accentText, p.bg)).toBeGreaterThan(contrastRatio(p.accent, p.bg))
  })

  it('uses the neutrals from the design', () => {
    expect(masterPalette('light', 'rose')).toMatchObject({ bg: '#FFFFFF', ink: '#0B0B0C' })
    expect(masterPalette('dark', 'rose')).toMatchObject({ bg: '#0E0E10', ink: '#F4F4F2' })
  })

  it('tints the soft accent toward the background', () => {
    expect(masterPalette('light', 'rose').accentSoft).toBe(mix('#CF3767', '#FFFFFF', 0.12))
  })
})
