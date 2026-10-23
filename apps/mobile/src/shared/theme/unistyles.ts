/**
 * Unistyles runtime configuration. This module MUST be imported before any
 * component that uses StyleSheet.create — import it first in src/app/_layout.tsx.
 * (Requires a dev build; crashes in Expo Go — see docs/design-system.md §2.)
 */
import { StyleSheet } from 'react-native-unistyles';
import { themes } from './themes';

export const breakpoints = {
  xs: 0,
  sm: 360,
  md: 768,
  lg: 1024,
} as const;

type AppThemes = typeof themes;
type AppBreakpoints = typeof breakpoints;

declare module 'react-native-unistyles' {
  // Module augmentation requires interfaces (not type aliases) — empty-extends is intentional.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesThemes extends AppThemes {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  themes,
  breakpoints,
  settings: {
    // Follow the OS by default; the theme store toggles this for explicit light/dark.
    adaptiveThemes: true,
  },
});
