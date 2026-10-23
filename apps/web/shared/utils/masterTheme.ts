/**
 * Colors of a master's public page: light or dark theme plus the master's accent
 * color. Ported from the master page prototype ("Seene: дизайн сайта"), so the
 * page matches the design. Stored in `master_settings.page_theme` /
 * `page_accent`; the accent is a preset key or a '#RRGGBB' color.
 */
export type MasterPageTheme = 'light' | 'dark'

/**
 * Accent presets from the master page spec. Rose, powder, lavender and gold are
 * taken from the design; sage, terracotta, graphite and black are not drawn
 * there yet and are placeholders until the designer picks them.
 */
export const ACCENT_PRESETS = {
  rose: '#CF3767',
  powder: '#A0646A',
  lavender: '#6D5DD3',
  sage: '#5E7D63',
  terracotta: '#C0603D',
  graphite: '#4A4A52',
  gold: '#C9A45C',
  black: '#0B0B0C'
} as const

export type AccentPreset = keyof typeof ACCENT_PRESETS

export const DEFAULT_PAGE_THEME: MasterPageTheme = 'light'
export const DEFAULT_PAGE_ACCENT: AccentPreset = 'rose'

const HEX_RE = /^#[0-9a-f]{6}$/i

export interface MasterPalette {
  /** Page background */
  bg: string
  /** Main text */
  ink: string
  /** Secondary text */
  muted: string
  /** Borders and dividers */
  line: string
  /** Muted surfaces: inputs, chips */
  surface: string
  /** Cards on the page background */
  card: string
  /** The master's color: buttons, selected states */
  accent: string
  /** Text and icons on an accent fill, at least 4.5:1 against it */
  onAccent: string
  /** Accent tint for soft backgrounds */
  accentSoft: string
  /** Accent for links and text on the page background */
  accentText: string
}

const NEUTRALS: Record<MasterPageTheme, Omit<MasterPalette, `accent${string}` | 'onAccent'>> = {
  light: {
    bg: '#FFFFFF',
    ink: '#0B0B0C',
    muted: '#5C5C63',
    line: '#E7E7E4',
    surface: '#F6F6F4',
    card: '#FFFFFF'
  },
  dark: {
    bg: '#0E0E10',
    ink: '#F4F4F2',
    muted: '#A3A3AB',
    line: '#2A2A30',
    surface: '#1B1B1F',
    card: '#16161A'
  }
}

/** A preset key or '#RRGGBB' → '#RRGGBB'; anything else → the default accent. */
export function resolveAccent(value: string | null | undefined): string {
  if (value && value in ACCENT_PRESETS) return ACCENT_PRESETS[value as AccentPreset]
  if (value && HEX_RE.test(value)) return value.toUpperCase()
  return ACCENT_PRESETS[DEFAULT_PAGE_ACCENT]
}

export function resolvePageTheme(value: string | null | undefined): MasterPageTheme {
  return value === 'dark' ? 'dark' : 'light'
}

export function masterPalette(
  theme: MasterPageTheme,
  accentValue: string | null | undefined
): MasterPalette {
  const neutrals = NEUTRALS[theme]
  const accent = resolveAccent(accentValue)
  const lum = luminance(accent)
  const dark = theme === 'dark'

  return {
    ...neutrals,
    accent,
    // White text needs 4.5:1 against the accent; otherwise use near-black ink.
    onAccent: contrastRatio('#FFFFFF', accent) >= 4.5 ? '#FFFFFF' : '#0B0B0C',
    accentSoft: mix(accent, neutrals.bg, dark ? 0.22 : 0.12),
    // Darken light accents on white, lighten dark accents on black, so links stay readable.
    accentText: dark
      ? lum < 0.18
        ? mix(accent, '#FFFFFF', 0.55)
        : accent
      : lum > 0.3
        ? mix(accent, '#000000', 0.6)
        : accent
  }
}

/** WCAG relative luminance of a '#RRGGBB' color. */
export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two '#RRGGBB' colors, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** `weight` of color `a` mixed with `1 - weight` of color `b`. */
export function mix(a: string, b: string, weight: number): string {
  const x = toRgb(a)
  const y = toRgb(b)
  return (
    '#' +
    x
      .map((v, i) =>
        Math.round(v * weight + y[i]! * (1 - weight))
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
      .toUpperCase()
  )
}

function toRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}
