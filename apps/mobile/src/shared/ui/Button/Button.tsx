/**
 * Action primitive. Variants: primary (ink) | secondary (surface) | ghost (text-only
 * link button) | danger. Sizes: sm | md | lg (lg = the design's 54pt CTA).
 * Disabled is a state of its own in the design (surface fill + secondary label),
 * not a faded primary. docs/design-system.md §4.
 */
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Text, type TextColor } from '@/shared/ui/Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
/** Label tone for the ghost variant: ink ("Войти по почте") or muted ("Позже"). */
export type ButtonTone = 'primary' | 'secondary';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
  loading?: boolean;
  /** A glyph from the icon set, or any node (brand mark, logo image). */
  leftIcon?: IconName | ReactNode;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  tone = 'primary',
  loading = false,
  leftIcon,
  fullWidth = true,
  disabled,
  ...rest
}: ButtonProps) {
  const { theme } = useUnistyles();
  const isDisabled = !!disabled || loading;
  styles.useVariants({ variant, size, fullWidth, disabled: !!disabled });

  const labelColor: TextColor = disabled
    ? 'secondary'
    : variant === 'primary' || variant === 'danger'
      ? 'onAccent'
      : variant === 'ghost'
        ? tone
        : 'primary';
  const iconColor = disabled
    ? 'content.secondary'
    : variant === 'primary' || variant === 'danger'
      ? 'accent.onAccent'
      : 'content.primary';
  const spinnerColor =
    variant === 'primary' || variant === 'danger'
      ? theme.colors.accent.onAccent
      : theme.colors.content.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [styles.container, pressed && !isDisabled && styles.pressed]}
      {...rest}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={spinnerColor} />
        ) : (
          <>
            {typeof leftIcon === 'string' ? (
              <Icon name={leftIcon as IconName} size="base" color={iconColor} />
            ) : (
              leftIcon
            )}
            <Text variant={size === 'lg' ? 'calloutStrong' : 'bodyStrong'} color={labelColor}>
              {label}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: theme.sizing.minTouch,
    paddingHorizontal: theme.space[4],
    variants: {
      variant: {
        primary: { backgroundColor: theme.colors.accent.default },
        secondary: { backgroundColor: theme.colors.bg.surface },
        ghost: { backgroundColor: 'transparent' },
        danger: { backgroundColor: theme.colors.feedback.danger },
      },
      size: {
        sm: { height: theme.sizing.control.sm, borderRadius: theme.radius.md },
        md: { height: theme.sizing.control.md, borderRadius: theme.radius.lg },
        lg: { height: theme.sizing.control.xl, borderRadius: theme.radius.lg },
      },
      fullWidth: {
        true: { alignSelf: 'stretch' },
        false: { alignSelf: 'flex-start' },
      },
      disabled: {
        true: {},
        false: {},
      },
    },
    compoundVariants: [
      { variant: 'primary', disabled: true, styles: { backgroundColor: theme.colors.bg.surface } },
      { variant: 'danger', disabled: true, styles: { backgroundColor: theme.colors.bg.surface } },
    ],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2.5],
  },
  pressed: { opacity: 0.85 },
}));
