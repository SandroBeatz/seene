/**
 * The single text primitive. Exposes `variant` (type scale) + `color` (content role).
 * No raw fontSize/fontWeight/color at call sites (docs/design-system.md §3.2).
 */
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { typography, type TypographyVariant } from '@/shared/theme/tokens';

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'disabled'
  | 'accent'
  | 'danger'
  | 'success'
  | 'warning';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: TextColor;
}

export function Text({ variant = 'body', color = 'primary', style, ...rest }: TextProps) {
  styles.useVariants({ variant, color });
  return <RNText style={[styles.text, style]} {...rest} />;
}

const styles = StyleSheet.create((theme) => ({
  text: {
    variants: {
      variant: {
        display: typography.display,
        title1: typography.title1,
        title2: typography.title2,
        title3: typography.title3,
        headline: typography.headline,
        body: typography.body,
        bodyStrong: typography.bodyStrong,
        callout: typography.callout,
        subhead: typography.subhead,
        footnote: typography.footnote,
        caption: typography.caption,
      },
      color: {
        primary: { color: theme.colors.content.primary },
        secondary: { color: theme.colors.content.secondary },
        tertiary: { color: theme.colors.content.tertiary },
        inverse: { color: theme.colors.content.inverse },
        disabled: { color: theme.colors.content.disabled },
        accent: { color: theme.colors.accent.default },
        danger: { color: theme.colors.feedback.danger },
        success: { color: theme.colors.feedback.success },
        warning: { color: theme.colors.feedback.warning },
      },
    },
  },
}));
