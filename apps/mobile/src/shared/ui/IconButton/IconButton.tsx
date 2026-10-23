/**
 * Content-level icon action. Native Stack headers use `Stack.Toolbar.Button`
 * instead, so iOS owns their shape, gestures, and Liquid Glass material.
 *
 * Always requires an accessibilityLabel (icon-only controls have no visible
 * text). Min 44×44 touch target. `glass` is reserved for custom floating chrome,
 * never for OS-owned navigation chrome. docs/design-system.md §4 / §7.
 */
import { Pressable, type PressableProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { GlassSurface } from '@/shared/ui/GlassSurface';
import { Icon, type IconName } from '@/shared/ui/Icon';

// 'default' is reserved by Unistyles variants (fallback key) — use 'neutral'.
export type IconButtonVariant = 'neutral' | 'accent' | 'danger' | 'ghost' | 'glass';

export interface IconButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  icon: IconName;
  accessibilityLabel: string;
  variant?: IconButtonVariant;
}

export function IconButton({ icon, variant = 'ghost', disabled, ...rest }: IconButtonProps) {
  const { theme } = useUnistyles();
  styles.useVariants({ variant });
  const isSolid = variant === 'accent' || variant === 'danger';
  const iconColor = disabled
    ? theme.colors.content.disabled
    : {
        neutral: theme.colors.content.primary,
        accent: theme.colors.accent.onAccent,
        danger: theme.colors.feedback.onColor,
        ghost: theme.colors.content.primary,
        glass: theme.colors.content.primary,
      }[variant];
  const rippleColor = isSolid
    ? theme.colors.interaction.onSolidPressed
    : theme.colors.interaction.onSurfacePressed;
  const iconNode = <Icon name={icon} size="md" color={iconColor} />;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={8}
      disabled={disabled}
      android_ripple={{
        color: rippleColor,
        borderless: true,
        foreground: true,
        radius: theme.sizing.minTouch / 2,
      }}
      style={({ pressed }) => [
        styles.base,
        pressed && process.env.EXPO_OS !== 'android' && variant !== 'glass' && styles.pressed,
        disabled && isSolid && styles.disabledSolid,
      ]}
      {...rest}>
      {variant === 'glass' ? (
        <GlassSurface isInteractive={!disabled} style={styles.glassSurface}>
          {iconNode}
        </GlassSurface>
      ) : (
        iconNode
      )}
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
    overflow: 'hidden',
    variants: {
      variant: {
        neutral: { backgroundColor: theme.colors.bg.sunken },
        accent: { backgroundColor: theme.colors.accent.default },
        danger: { backgroundColor: theme.colors.feedback.danger },
        ghost: { backgroundColor: 'transparent' },
        glass: { backgroundColor: 'transparent' },
      },
    },
  },
  glassSurface: {
    flex: 1,
    alignSelf: 'stretch',
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pressed: { transform: [{ scale: 0.96 }] },
  disabledSolid: { backgroundColor: theme.colors.bg.sunken },
}));
