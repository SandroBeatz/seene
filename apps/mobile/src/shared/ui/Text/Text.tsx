/**
 * The single text primitive. Exposes `variant` (type scale) + `color` (content role).
 * No raw fontSize/fontWeight/color at call sites (docs/design-system.md §3.2).
 *
 * Every variant carries its own font family (one static face per weight), so text
 * renders with the same metrics on iOS and Android. Android's extra font padding is
 * turned off for the same reason, and font scaling is capped at MAX_FONT_SCALE.
 */
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { MAX_FONT_SCALE, typography, type TypographyVariant } from '@/shared/theme/tokens';

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'disabled'
  | 'accent'
  | 'onAccent'
  | 'brand'
  | 'brandStrong'
  | 'onDarkMuted'
  /** Theme-invariant ink / white — for content on fixed-colour surfaces over photos. */
  | 'ink'
  | 'white'
  /** Success green that stays dark on fixed white surfaces. */
  | 'inkSuccess'
  | 'danger'
  | 'success'
  | 'warning';

export type TextAlign = 'auto' | 'left' | 'center' | 'right';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: TextColor;
  align?: TextAlign;
  /** Lining, fixed-width digits (times, codes, counters). */
  tabularNums?: boolean;
}

export function Text({
  variant = 'body',
  color = 'primary',
  align = 'auto',
  tabularNums = false,
  maxFontSizeMultiplier = MAX_FONT_SCALE,
  style,
  ...rest
}: TextProps) {
  styles.useVariants({ variant, color, align, tabularNums });
  return (
    <RNText maxFontSizeMultiplier={maxFontSizeMultiplier} style={[styles.text, style]} {...rest} />
  );
}

const styles = StyleSheet.create((theme) => ({
  text: {
    includeFontPadding: false,
    variants: {
      variant: typography,
      color: {
        primary: { color: theme.colors.content.primary },
        secondary: { color: theme.colors.content.secondary },
        tertiary: { color: theme.colors.content.tertiary },
        inverse: { color: theme.colors.content.inverse },
        disabled: { color: theme.colors.content.disabled },
        accent: { color: theme.colors.accent.default },
        onAccent: { color: theme.colors.accent.onAccent },
        brand: { color: theme.colors.brand.text },
        brandStrong: { color: theme.colors.brand.strong },
        onDarkMuted: { color: theme.colors.content.onDarkMuted },
        ink: { color: theme.colors.constant.ink },
        white: { color: theme.colors.constant.white },
        inkSuccess: { color: theme.colors.constant.success },
        danger: { color: theme.colors.feedback.danger },
        success: { color: theme.colors.feedback.success },
        warning: { color: theme.colors.feedback.warning },
      },
      align: {
        auto: { textAlign: 'auto' },
        left: { textAlign: 'left' },
        center: { textAlign: 'center' },
        right: { textAlign: 'right' },
      },
      tabularNums: {
        true: { fontVariant: ['tabular-nums'] },
        false: {},
      },
    },
  },
}));
