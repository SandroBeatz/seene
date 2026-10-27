/**
 * Primitive design tokens — raw scales, theme-agnostic.
 * Components NEVER import these directly; they consume the semantic tokens exposed
 * on the Unistyles theme (see themes.ts). Only themes.ts maps primitives → roles.
 *
 * Values come from the "Seene: дизайн сайта" artboard (app onboarding boards):
 * a monochrome ink base with a rose brand accent, Inter + Inter Tight type.
 */

// ---- Primitive color scales ----
export const palette = {
  // Warm neutral ramp. 0 = white, 950 = brand ink.
  neutral: {
    0: '#FFFFFF',
    50: '#F6F6F4',
    100: '#F0F0EE',
    200: '#E7E7E4',
    250: '#D9D9D6',
    300: '#D6D6D2',
    350: '#C9C9C4',
    400: '#A1A1A8',
    450: '#75757C',
    500: '#8E8E94',
    600: '#5C5C63',
    650: '#4A4A50',
    700: '#3A3A3F',
    800: '#2A2A2E',
    850: '#1F1F22',
    900: '#161618',
    950: '#0B0B0C',
    1000: '#000000',
  },
  // Brand accent — "Seene Rose".
  rose: {
    50: '#FDEBF0',
    200: '#F4B8C9',
    300: '#F08AA6',
    500: '#CF3767',
    600: '#B92D5A',
    700: '#9E2449',
    darkSubtle: '#3A1622',
    darkDefault: '#E0577F',
  },
  // Feedback hues (light base + dark-theme subtle pair).
  green: { base: '#0E7A3F', bright: '#3FBF7A', subtleLight: '#E3F3EA', subtleDark: '#0F2C1D' },
  amber: { base: '#D98A0B', subtleLight: '#FBF0DA', subtleDark: '#2E2411' },
  blue: { base: '#3B82F6', subtleLight: '#E4EEFC', subtleDark: '#15223A' },
  translucent: {
    whiteStrong: 'rgba(255, 255, 255, 0.94)',
    whiteBar: 'rgba(255, 255, 255, 0.92)',
    whiteClear: 'rgba(255, 255, 255, 0)',
    whiteMuted: 'rgba(255, 255, 255, 0.7)',
    whitePressed: 'rgba(255, 255, 255, 0.24)',
    blackStrong: 'rgba(0, 0, 0, 0.94)',
    blackBar: 'rgba(22, 22, 24, 0.92)',
    blackClear: 'rgba(0, 0, 0, 0)',
    blackPressed: 'rgba(0, 0, 0, 0.12)',
    scrim: 'rgba(11, 11, 12, 0.4)',
    scrimStrong: 'rgba(11, 11, 12, 0.45)',
    scrimLight: 'rgba(11, 11, 12, 0.25)',
    scrimDark: 'rgba(0, 0, 0, 0.6)',
    blackDim: 'rgba(0, 0, 0, 0.18)',
    whiteEdge: 'rgba(255, 255, 255, 0.9)',
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
  completed: '#0E7A3F', // green — done
  cancelled: '#8E8E94', // gray — voided
  no_show: '#CF3767', // rose — missed
  expired: '#C9C9C4', // muted — lapsed
} as const;

/** Calendar colours a master can assign to a service (service sheet, 8 swatches). */
export const servicePalette = {
  rose: '#EBA9BC',
  peach: '#F2B990',
  sand: '#E6CF85',
  sage: '#ADC9A0',
  mint: '#93CFC4',
  sky: '#A3C4EA',
  lavender: '#BEAEE3',
  grey: '#CFCFCB',
} as const;

// 8-hue client-initials avatar set.
export const clientHues = [
  '#EBA9BC',
  '#F2B990',
  '#E6CF85',
  '#ADC9A0',
  '#93CFC4',
  '#A3C4EA',
  '#BEAEE3',
  '#CFCFCB',
] as const;

// ---- Non-color primitive scales (shared across themes) ----

/** 4-pt rhythm; half steps (x.5) carry the design's 2/6/10/14/18/22/26/30 values. */
export const space = {
  0: 0,
  0.25: 1,
  0.5: 2,
  1: 4,
  1.25: 5,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  4.5: 18,
  5: 20,
  5.5: 22,
  6: 24,
  6.5: 26,
  7: 28,
  7.5: 30,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

/**
 * Corner radii. The generic scale (xs…xxl) covers most surfaces; the named roles
 * are the off-scale values the design uses for one kind of element each.
 */
export const radius = {
  none: 0,
  xs: 4, // chat-bubble tail
  sm: 8, // checkbox
  md: 12, // chips, thumbnails, small buttons
  lg: 16, // buttons, inputs, form groups
  xl: 20, // grouped cards, tiles, bubbles
  xxl: 28, // sheets, hero photo, dialogs
  full: 9999,
  bar: 2, // progress bars, grabber
  segment: 10, // segmented-control thumb
  field: 14, // code cells, search, segmented track
  panel: 22, // review summary card
  showcase: 24, // illustration card
} as const;

// Control heights & icon/avatar sizing. 44 is the min touch target.
export const sizing = {
  icon: { xs: 12, mark: 13, sm: 16, base: 18, md: 20, lg: 24, xl: 34 },
  avatar: { sm: 28, md: 44, lg: 56, xl: 64, xxl: 76 },
  /** Initials font size per avatar size. */
  avatarText: { sm: 11, md: 15, lg: 18, xl: 19, xxl: 26 },
  control: { xs: 30, sm: 36, md: 44, lg: 48, xl: 54 },
  /** Round icon button (back / close). */
  iconButton: 40,
  /** Pressable rows: settings rows, list rows, option rows. */
  row: { sm: 52, md: 56, lg: 60, xl: 64 },
  codeCell: 58,
  segment: 38,
  timeField: 68,
  tile: 136,
  selection: 24, // checkbox / radio mark
  swatch: 36,
  progress: 4,
  grabber: { width: 40, height: 4 },
  switch: {
    md: { width: 50, height: 30, knob: 24, padding: 3 },
    sm: { width: 46, height: 27, knob: 23, padding: 2 },
  },
  minTouch: 44,
} as const;

/**
 * Font families. Each static weight is its own family (named after the font's
 * PostScript name, which is also the file name) so iOS and Android resolve the
 * same face without relying on fontWeight. See app.json → expo-font.
 */
export const fontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  displaySemibold: 'InterTight-SemiBold',
  displayBold: 'InterTight-Bold',
} as const;

/**
 * Type scale — each variant bundles family / size / lineHeight / letterSpacing.
 * letterSpacing is in px (the design's em values × font size).
 */
export const typography = {
  display: {
    fontFamily: fontFamily.displayBold,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: -0.9,
  },
  title1: {
    fontFamily: fontFamily.displayBold,
    fontSize: 28,
    lineHeight: 31,
    letterSpacing: -0.84,
  },
  title2: {
    fontFamily: fontFamily.displayBold,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.78,
  },
  figure: {
    fontFamily: fontFamily.displayBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.48,
  },
  stat: { fontFamily: fontFamily.displayBold, fontSize: 20, lineHeight: 24, letterSpacing: -0.4 },
  title3: {
    fontFamily: fontFamily.displayBold,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.38,
  },
  tile: { fontFamily: fontFamily.displayBold, fontSize: 16, lineHeight: 18, letterSpacing: -0.16 },
  bodyLarge: { fontFamily: fontFamily.regular, fontSize: 17, lineHeight: 22, letterSpacing: 0 },
  headline: { fontFamily: fontFamily.semibold, fontSize: 17, lineHeight: 22, letterSpacing: 0 },
  callout: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 21, letterSpacing: 0 },
  calloutMedium: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 21, letterSpacing: 0 },
  calloutStrong: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: 0,
  },
  body: { fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 22, letterSpacing: 0 },
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: 15, lineHeight: 20, letterSpacing: 0 },
  bodyStrong: { fontFamily: fontFamily.semibold, fontSize: 15, lineHeight: 20, letterSpacing: 0 },
  subhead: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  subheadStrong: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  footnote: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 19, letterSpacing: 0 },
  footnoteStrong: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  caption: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 17, letterSpacing: 0 },
  captionStrong: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption2: { fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 14, letterSpacing: 0 },
  caption2Strong: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0,
  },
  overline: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.66,
    textTransform: 'uppercase',
  },
  micro: { fontFamily: fontFamily.semibold, fontSize: 10, lineHeight: 13, letterSpacing: 0 },
} as const;

/**
 * Cross-platform shadows (`boxShadow`, rendered identically on iOS and Android).
 * Named by the element that casts them.
 */
export const shadow = {
  none: 'none',
  knob: '0px 1px 3px rgba(0, 0, 0, 0.2)',
  segment: '0px 1px 3px rgba(0, 0, 0, 0.1)',
  bar: '0px 6px 20px rgba(0, 0, 0, 0.06)',
  fab: '0px 6px 20px rgba(0, 0, 0, 0.12)',
  bubble: '0px 12px 30px rgba(0, 0, 0, 0.18)',
  bubbleDark: '0px 12px 30px rgba(0, 0, 0, 0.22)',
  pop: '0px 10px 26px rgba(0, 0, 0, 0.14)',
  showcase: '0px 24px 60px rgba(11, 11, 12, 0.12)',
  dialog: '0px 30px 80px rgba(0, 0, 0, 0.25)',
} as const;

export const motion = {
  duration: { fast: 120, base: 200, fade: 300, slow: 320, sheet: 400, enter: 550 },
  easing: {
    standard: [0.2, 0, 0, 1] as const,
    entrance: [0, 0, 0, 1] as const,
    exit: [0.4, 0, 1, 1] as const,
    /** Soft overshoot-free ease-out used by every enter animation in the design. */
    emphasized: [0.22, 1, 0.36, 1] as const,
  },
} as const;

/** Icon stroke widths (24-unit viewBox). The design varies weight by context. */
export const iconStroke = {
  light: 1.8,
  regular: 2,
  medium: 2.2,
  bold: 2.4,
  heavy: 2.6,
  black: 3,
} as const;

/** Third-party marks whose colours are fixed by their brand guidelines. */
export const brandMarks = {
  google: { blue: '#4285F4', green: '#34A853', yellow: '#FBBC05', red: '#EA4335' },
} as const;

/**
 * Screen layout. The design frames are iPhone-sized (390×844) with content 20pt
 * from the sides; top/bottom gaps are added on top of the device safe area.
 */
export const layout = {
  gutter: 20,
  topGap: 10,
  minBottomGap: 16,
} as const;

/** Upper bound for Dynamic Type / Android font scale so fixed-height controls hold. */
export const MAX_FONT_SCALE = 1.3;

export type TypographyVariant = keyof typeof typography;
export type AppointmentStatusColorKey = keyof typeof statusPalette;
export type ServiceColorKey = keyof typeof servicePalette;
