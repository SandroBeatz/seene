/**
 * Semantic themes (light/dark). Components consume ONLY these role tokens via
 * the Unistyles theme object — never primitives, never raw hex.
 * Adding a color === adding a semantic role here (see docs/design-system.md §5).
 *
 * Light matches the design 1:1. Dark is derived from the same roles (the design
 * has no dark boards yet) and is reviewed separately.
 */
import {
  clientHues,
  motion,
  palette,
  layout,
  radius,
  servicePalette,
  shadow,
  sizing,
  space,
  statusPalette,
  typography,
} from './tokens';

const shared = {
  space,
  radius,
  sizing,
  typography,
  motion,
  shadow,
  layout,
  // Fixed domain palettes are tokens too — never inline these hexes.
  status: statusPalette,
  service: servicePalette,
  clientHue: clientHues,
  gap: (n: keyof typeof space) => space[n],
} as const;

const n = palette.neutral;

export const lightTheme = {
  ...shared,
  name: 'light',
  colors: {
    bg: {
      canvas: n[0],
      // Grouped rows, secondary buttons, icon buttons, search fields.
      surface: n[50],
      elevated: n[0],
      // Progress tracks, subtle wells.
      sunken: n[100],
    },
    content: {
      primary: n[950],
      secondary: n[600],
      tertiary: n[500],
      inverse: n[0],
      disabled: n[500],
      /** Secondary text on dark/photo surfaces. */
      onDarkMuted: palette.translucent.whiteMuted,
    },
    border: {
      subtle: n[100],
      default: n[200],
      // Unchecked checkbox/radio outlines, dashed "add" buttons.
      strong: n[350],
      // Focused / active field outline.
      focus: n[950],
      // Dashed placeholder outlines (empty states).
      dashed: n[300],
    },
    control: {
      // Switch track when off.
      trackOff: n[300],
      knob: n[0],
      // Focus halo around the active price field.
      focusRing: n[100],
    },
    overlay: {
      scrim: palette.translucent.scrim,
      scrimStrong: palette.translucent.scrimStrong,
      scrimLight: palette.translucent.scrimLight,
      // Behind a popover menu, and the menu's own fill.
      menuScrim: palette.translucent.scrimMenu,
      menu: palette.translucent.whiteBar,
      // Floating tab bar fill.
      bar: palette.translucent.whiteBar,
      // Over photos: unchecked selection mark fill, its outline, and the label shade.
      onImageDim: palette.translucent.blackDim,
      onImageEdge: palette.translucent.whiteEdge,
      photoShade: palette.translucent.scrimDark,
    },
    navigation: {
      headerGradientStart: palette.translucent.whiteStrong,
      headerGradientEnd: palette.translucent.whiteClear,
    },
    interaction: {
      onSurfacePressed: palette.translucent.blackPressed,
      onSolidPressed: palette.translucent.whitePressed,
    },
    // Primary actions & selection: ink.
    accent: {
      default: n[950],
      pressed: n[700],
      subtle: n[50],
      onAccent: n[0],
    },
    // Brand rose: links, badges, initials avatars, error emphasis.
    brand: {
      default: palette.rose[500],
      text: palette.rose[600],
      strong: palette.rose[700],
      subtle: palette.rose[50],
      soft: palette.rose[200],
    },
    // Theme-invariant absolutes — same in light & dark. For brand surfaces that must
    // not flip with the theme (e.g. the Google button is always white).
    constant: {
      white: n[0],
      black: n[1000],
      ink: n[950],
      /** Success green on fixed white surfaces (WhatsApp reply card over a photo). */
      success: palette.green.base,
    },
    feedback: {
      success: palette.green.base,
      successSubtle: palette.green.subtleLight,
      warning: palette.amber.base,
      warningSubtle: palette.amber.subtleLight,
      danger: palette.rose[700],
      dangerBorder: palette.rose[500],
      dangerSubtle: palette.rose[50],
      info: palette.blue.base,
      infoSubtle: palette.blue.subtleLight,
      onColor: n[0],
    },
    // Status pills and attention cards, keyed by `StatusTone` (entities/appointment):
    // `fg` text + icon, `bg` pill fill, `dot` the leading dot. `summaryNow` = the
    // "сейчас" segment on the dark day summary.
    tone: {
      neutral: { fg: n[950], bg: n[50], dot: n[950] },
      brand: { fg: palette.rose[600], bg: palette.tone.roseSubtle, dot: palette.rose[500] },
      warning: {
        fg: palette.tone.amberText,
        bg: palette.tone.amberSubtle,
        dot: palette.tone.amberText,
      },
      success: { fg: palette.green.base, bg: palette.tone.greenSubtle, dot: palette.green.base },
      danger: { fg: palette.tone.red, bg: palette.tone.redSubtle, dot: palette.tone.red },
      muted: { fg: n[600], bg: n[100], dot: n[600] },
      info: { fg: palette.tone.slate, bg: palette.tone.slateSubtle, dot: palette.tone.slate },
      summaryNow: palette.tone.roseNow,
    },
    vip: palette.vip,
  },
  elevation: {
    0: {},
    1: {
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    2: {
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    3: {
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    4: {
      shadowColor: '#000',
      shadowOpacity: 0.16,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 12 },
      elevation: 10,
    },
  },
} as const;

export const darkTheme = {
  ...shared,
  name: 'dark',
  colors: {
    bg: {
      canvas: n[950],
      surface: n[850],
      elevated: n[900],
      sunken: n[800],
    },
    content: {
      primary: n[50],
      secondary: n[400],
      tertiary: n[450],
      inverse: n[950],
      disabled: n[450],
      onDarkMuted: palette.translucent.whiteMuted,
    },
    border: {
      subtle: n[850],
      default: n[800],
      strong: n[650],
      focus: n[50],
      dashed: n[700],
    },
    control: {
      trackOff: n[700],
      knob: n[0],
      focusRing: n[800],
    },
    overlay: {
      scrim: palette.translucent.scrimDark,
      scrimStrong: palette.translucent.scrimDark,
      scrimLight: palette.translucent.scrim,
      menuScrim: palette.translucent.scrimMenu,
      menu: n[800],
      bar: palette.translucent.blackBar,
      onImageDim: palette.translucent.blackDim,
      onImageEdge: palette.translucent.whiteEdge,
      photoShade: palette.translucent.scrimDark,
    },
    navigation: {
      headerGradientStart: palette.translucent.blackStrong,
      headerGradientEnd: palette.translucent.blackClear,
    },
    interaction: {
      onSurfacePressed: palette.translucent.whitePressed,
      onSolidPressed: palette.translucent.blackPressed,
    },
    accent: {
      default: n[50],
      pressed: n[250],
      subtle: n[850],
      onAccent: n[950],
    },
    brand: {
      default: palette.rose.darkDefault,
      text: palette.rose[300],
      strong: palette.rose[200],
      subtle: palette.rose.darkSubtle,
      soft: palette.rose[700],
    },
    // Theme-invariant absolutes — identical to the light theme by design.
    constant: {
      white: n[0],
      black: n[1000],
      ink: n[950],
      /** Success green on fixed white surfaces (WhatsApp reply card over a photo). */
      success: palette.green.base,
    },
    feedback: {
      success: palette.green.bright,
      successSubtle: palette.green.subtleDark,
      warning: palette.amber.base,
      warningSubtle: palette.amber.subtleDark,
      danger: palette.rose[300],
      dangerBorder: palette.rose.darkDefault,
      dangerSubtle: palette.rose.darkSubtle,
      info: palette.blue.base,
      infoSubtle: palette.blue.subtleDark,
      onColor: n[0],
    },
    tone: {
      neutral: { fg: n[50], bg: n[850], dot: n[50] },
      brand: { fg: palette.rose[300], bg: palette.rose.darkSubtle, dot: palette.rose.darkDefault },
      warning: {
        fg: palette.tone.amberBright,
        bg: palette.amber.subtleDark,
        dot: palette.tone.amberBright,
      },
      success: {
        fg: palette.green.bright,
        bg: palette.green.subtleDark,
        dot: palette.green.bright,
      },
      danger: {
        fg: palette.tone.redBright,
        bg: palette.tone.redSubtleDark,
        dot: palette.tone.redBright,
      },
      muted: { fg: n[400], bg: n[800], dot: n[400] },
      info: {
        fg: palette.tone.slateBright,
        bg: palette.tone.slateSubtleDark,
        dot: palette.tone.slateBright,
      },
      summaryNow: palette.tone.roseNow,
    },
    vip: palette.vip,
  },
  elevation: {
    0: {},
    1: {
      shadowColor: '#000',
      shadowOpacity: 0.4,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    2: {
      shadowColor: '#000',
      shadowOpacity: 0.5,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    3: {
      shadowColor: '#000',
      shadowOpacity: 0.6,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    4: {
      shadowColor: '#000',
      shadowOpacity: 0.7,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 12 },
      elevation: 10,
    },
  },
} as const;

export const themes = { light: lightTheme, dark: darkTheme } as const;

export type AppTheme = typeof lightTheme;
