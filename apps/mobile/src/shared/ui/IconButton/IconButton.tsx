/**
 * Tappable icon. Always requires an accessibilityLabel (icon-only controls have no
 * visible text). Min 44×44 touch target. docs/design-system.md §4 / §7.
 */
import { Pressable, type PressableProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon, type IconName } from '@/shared/ui/Icon';

// 'default' is reserved by Unistyles variants (fallback key) — use 'neutral'.
export type IconButtonVariant = 'neutral' | 'accent' | 'danger' | 'ghost';

export interface IconButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  icon: IconName;
  accessibilityLabel: string;
  variant?: IconButtonVariant;
}

const ICON_COLOR: Record<IconButtonVariant, string> = {
  neutral: 'content.primary',
  accent: 'accent.onAccent',
  danger: 'feedback.onColor',
  ghost: 'content.secondary',
};

export function IconButton({
  icon,
  variant = 'neutral',
  disabled,
  ...rest
}: IconButtonProps) {
  styles.useVariants({ variant });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={8}
      disabled={disabled}
      style={({ pressed }) => [styles.base, pressed && styles.pressed, disabled && styles.disabled]}
      {...rest}>
      <Icon name={icon} size="md" color={ICON_COLOR[variant]} />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  base: {
    width: theme.sizing.minTouch,
    height: theme.sizing.minTouch,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      variant: {
        neutral: { backgroundColor: theme.colors.bg.sunken },
        accent: { backgroundColor: theme.colors.accent.default },
        danger: { backgroundColor: theme.colors.feedback.danger },
        ghost: { backgroundColor: 'transparent' },
      },
    },
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
}));
