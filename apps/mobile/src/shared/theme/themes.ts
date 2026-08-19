/**
 * Semantic themes (light/dark). Components consume ONLY these role tokens via
 * the Unistyles theme object — never primitives, never raw hex.
 * Adding a color === adding a semantic role here (see docs/design-system.md §5).
 */
import {
  clientHues,
  motion,
  palette,
  radius,
  servicePalette,
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
  // Fixed domain palettes are tokens too — never inline these hexes.
  status: statusPalette,
  service: servicePalette,
  clientHue: clientHues,
  gap: (n: keyof typeof space) => space[n],
} as const;

export const lightTheme = {
  ...shared,
  name: 'light',
  colors: {
    bg: {
      canvas: palette.gray[0],
      surface: palette.gray[50],
      elevated: palette.gray[0],
      sunken: palette.gray[100],
    },
    content: {
      primary: palette.gray[950],
      secondary: palette.gray[600],
      tertiary: palette.gray[500],
      inverse: palette.gray[0],
      disabled: palette.gray[400],
    },
    border: {
      subtle: palette.gray[100],
      default: palette.gray[200],
      strong: palette.gray[300],
    },
    accent: {
      default: palette.violet.default,
      pressed: palette.violet.pressed,
      subtle: palette.violet.subtleLight,
      onAccent: palette.gray[0],
    },
    feedback: {
      success: palette.green.base,
      successSubtle: palette.green.subtleLight,
      warning: palette.amber.base,
      warningSubtle: palette.amber.subtleLight,
      danger: palette.red.base,
      dangerSubtle: palette.red.subtleLight,
      info: palette.blue.base,
      infoSubtle: palette.blue.subtleLight,
      onColor: palette.gray[0],
    },
  },
  elevation: {
    0: {},
    1: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    2: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
    3: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
    4: { shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 28, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
  },
} as const;

export const darkTheme = {
  ...shared,
  name: 'dark',
  colors: {
    bg: {
      canvas: palette.gray[1000],
      surface: palette.gray[950],
      elevated: palette.gray[900],
      sunken: palette.gray[950],
    },
    content: {
      primary: palette.gray[50],
      secondary: palette.gray[400],
      tertiary: palette.gray[500],
      inverse: palette.gray[950],
      disabled: palette.gray[600],
    },
    border: {
      subtle: palette.gray[900],
      default: palette.gray[800],
      strong: palette.gray[700],
    },
    accent: {
      default: palette.violet.defaultDark,
      pressed: palette.violet.pressedDark,
      subtle: palette.violet.subtleDark,
      onAccent: palette.gray[1000],
    },
    feedback: {
      success: palette.green.base,
      successSubtle: palette.green.subtleDark,
      warning: palette.amber.base,
      warningSubtle: palette.amber.subtleDark,
      danger: palette.red.base,
      dangerSubtle: palette.red.subtleDark,
      info: palette.blue.base,
      infoSubtle: palette.blue.subtleDark,
      onColor: palette.gray[0],
    },
  },
  elevation: {
    0: {},
    1: { shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    2: { shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
    3: { shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
    4: { shadowColor: '#000', shadowOpacity: 0.7, shadowRadius: 28, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
  },
} as const;

export const themes = { light: lightTheme, dark: darkTheme } as const;

export type AppTheme = typeof lightTheme;
