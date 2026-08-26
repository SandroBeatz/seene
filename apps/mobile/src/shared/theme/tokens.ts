/**
 * Primitive design tokens — raw scales, theme-agnostic.
 * Components NEVER import these directly; they consume the semantic tokens exposed
 * on the Unistyles theme (see themes.ts). Only themes.ts maps primitives → roles.
 *
 * These are seed values (Seene Violet accent, neutral base). The final ramps come
 * from the design pass (Q-DS-1) and only this file changes when they land.
 */

// ---- Primitive color scales ----
export const palette = {
  // Neutral gray ramp (Instagram/Threads-like restraint)
  gray: {
    0: '#FFFFFF',
    50: '#F7F7F8',
    100: '#F0F0F3',
    200: '#E4E4E9',
    300: '#D2D2DA',
    400: '#A9A9B6',
    500: '#7C7C8A',
    600: '#5A5A67',
    700: '#3F3F49',
    800: '#27272E',
    900: '#18181C',
    950: '#0E0E11',
    1000: '#000000',
  },
  // Brand accent — "Seene Violet"
  violet: {
    subtleLight: '#EEEAFE',
    subtleDark: '#221C3D',
    default: '#7A5AF8',
    defaultDark: '#8B6DFF',
    pressed: '#6947E4',
    pressedDark: '#7C5CF0',
  },
  // Feedback hues (base 500-ish; themes derive subtle/on pairs)
  green: { base: '#1FA971', subtleLight: '#E4F6EE', subtleDark: '#0F2C22' },
  amber: { base: '#D98A0B', subtleLight: '#FBF0DA', subtleDark: '#2E2411' },
  red: { base: '#E5484D', subtleLight: '#FCE9E9', subtleDark: '#331717' },
  blue: { base: '#3B82F6', subtleLight: '#E4EEFC', subtleDark: '#15223A' },
  translucent: {
    whiteStrong: 'rgba(255, 255, 255, 0.94)',
    whiteClear: 'rgba(255, 255, 255, 0)',
    whitePressed: 'rgba(255, 255, 255, 0.24)',
    blackStrong: 'rgba(0, 0, 0, 0.94)',
    blackClear: 'rgba(0, 0, 0, 0)',
    blackPressed: 'rgba(0, 0, 0, 0.12)',
  },
} as const;

/**
 * Appointment status hues — drive status pills & calendar events.
 * Statuses: pending | confirmed | completed | cancelled | no_show | expired
 * (see docs/business-logic.md §4 & domain-model.md §4).
 */
export const statusPalette = {
  pending: '#D98A0B', // amber — awaiting action
  confirmed: '#3B82F6', // blue — booked
  completed: '#1FA971', // green — done
  cancelled: '#7C7C8A', // gray — voided
  no_show: '#E5484D', // red — missed
  expired: '#A9A9B6', // muted — lapsed
} as const;

// Fixed service accent palette (assignable per service).
export const servicePalette = [
  '#7A5AF8',
  '#3B82F6',
  '#1FA971',
  '#D98A0B',
  '#E5484D',
  '#EC4899',
  '#14B8A6',
  '#8B5CF6',
] as const;

// 8-hue client-initials avatar set.
export const clientHues = [
  '#7A5AF8',
  '#3B82F6',
  '#1FA971',
  '#D98A0B',
  '#E5484D',
  '#EC4899',
  '#14B8A6',
  '#F97316',
] as const;

// ---- Non-color primitive scales (shared across themes) ----

// 4-pt spacing rhythm.
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

// Control heights & icon/avatar sizing. 44 is the min touch target.
export const sizing = {
  icon: { sm: 16, md: 20, lg: 24 },
  avatar: { sm: 28, md: 40, lg: 56, xl: 80 },
  control: { sm: 36, md: 44, lg: 52 },
  minTouch: 44,
} as const;

// Type scale — each variant bundles size / lineHeight / weight / letterSpacing.
export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: 0.2 },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: 0.2 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: 0 },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: 0 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: 0 },
  body: { fontSize: 17, lineHeight: 24, fontWeight: '400', letterSpacing: 0 },
  bodyStrong: { fontSize: 17, lineHeight: 24, fontWeight: '600', letterSpacing: 0 },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400', letterSpacing: 0 },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400', letterSpacing: 0 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0.1 },
} as const;

export const motion = {
  duration: { fast: 120, base: 200, slow: 320 },
  easing: {
    standard: [0.2, 0, 0, 1] as const,
    entrance: [0, 0, 0, 1] as const,
    exit: [0.4, 0, 1, 1] as const,
  },
} as const;

export type TypographyVariant = keyof typeof typography;
export type AppointmentStatusColorKey = keyof typeof statusPalette;
