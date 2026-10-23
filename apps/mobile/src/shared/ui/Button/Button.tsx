/**
 * Primary action primitive. Variants: primary | secondary | ghost | danger.
 * Sizes: sm | md | lg. Handles pressed/disabled/loading + a11y + min touch target.
 * docs/design-system.md §4.
 */
import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/ui/Text';
import { Icon, type IconName } from '@/shared/ui/Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: IconName;
  fullWidth?: boolean;
}

const LABEL_COLOR: Record<ButtonVariant, 'inverse' | 'primary' | 'accent'> = {
  primary: 'inverse',
  secondary: 'primary',
  ghost: 'accent',
  danger: 'inverse',
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  fullWidth = false,
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  styles.useVariants({ variant, size, fullWidth });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [styles.container, pressed && styles.pressed, isDisabled && styles.disabled]}
      {...rest}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" />
        ) : (
          <>
            {leftIcon ? <Icon name={leftIcon} size="sm" color={colorRoleForIcon(variant)} /> : null}
            <Text variant="headline" color={LABEL_COLOR[variant]}>
              {label}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

function colorRoleForIcon(variant: ButtonVariant): string {
  if (variant === 'primary' || variant === 'danger') return 'accent.onAccent';
  if (variant === 'ghost') return 'accent.default';
  return 'content.primary';
}

const styles = StyleSheet.create((theme) => ({
  container: {
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: theme.sizing.control.md,
    minWidth: theme.sizing.minTouch,
    paddingHorizontal: theme.space[4],
    variants: {
      variant: {
        primary: { backgroundColor: theme.colors.accent.default },
        secondary: {
          backgroundColor: theme.colors.bg.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.default,
        },
        ghost: { backgroundColor: 'transparent' },
        danger: { backgroundColor: theme.colors.feedback.danger },
      },
      size: {
        sm: { minHeight: theme.sizing.control.sm, paddingHorizontal: theme.space[3] },
        md: { minHeight: theme.sizing.control.md },
        lg: { minHeight: theme.sizing.control.lg, paddingHorizontal: theme.space[5] },
      },
      fullWidth: {
        true: { alignSelf: 'stretch' },
        false: { alignSelf: 'flex-start' },
      },
    },
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
}));
