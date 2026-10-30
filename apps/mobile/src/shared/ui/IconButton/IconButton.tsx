/**
 * Content-level icon action. Native Stack headers use `Stack.Toolbar.Button`
 * instead, so iOS owns their shape, gestures, and Liquid Glass material.
 *
 * Always requires an accessibilityLabel (icon-only controls have no visible
 * text). Sizes: md = the design's 40pt round back/close button, lg = 44pt header
 * button; both keep a 44×44 touch target via hitSlop. `glass` is reserved for
 * custom floating chrome, never for OS-owned navigation chrome.
 * docs/design-system.md §4 / §7.
 */
import { Pressable, type PressableProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { GlassSurface } from '@/shared/ui/GlassSurface';
import { Icon, type IconName, type IconProps, type IconSize } from '@/shared/ui/Icon';

// 'default' is reserved by Unistyles variants (fallback key) — use 'neutral'.
export type IconButtonVariant = 'neutral' | 'accent' | 'danger' | 'ghost' | 'glass';
export type IconButtonSize = 'md' | 'lg';

export interface IconButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  icon: IconName;
  accessibilityLabel: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  iconSize?: IconSize | number;
  /** Icon colour role, overriding the variant's ("tone.danger.fg" for a red trash). */
  iconColor?: IconProps['color'];
}

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  iconSize,
  iconColor: iconColorOverride,
  disabled,
  ...rest
}: IconButtonProps) {
  const { theme } = useUnistyles();
  styles.useVariants({ variant, size });
  const isSolid = variant === 'accent' || variant === 'danger';
  const iconColor = disabled
    ? 'content.disabled'
    : (iconColorOverride ?? {
        neutral: 'content.primary',
        accent: 'accent.onAccent',
        danger: 'feedback.onColor',
        ghost: 'content.primary',
        glass: 'content.primary',
      }[variant]);
  const rippleColor = isSolid
    ? theme.colors.interaction.onSolidPressed
    : theme.colors.interaction.onSurfacePressed;
  const box = size === 'md' ? theme.sizing.iconButton : theme.sizing.minTouch;
  const slop = Math.max(0, (theme.sizing.minTouch - box) / 2) + theme.space[1];
  const iconNode = (
    <Icon name={icon} size={iconSize ?? (size === 'md' ? 'base' : 'md')} color={iconColor} />
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={slop}
      disabled={disabled}
      android_ripple={{
        color: rippleColor,
        borderless: true,
        foreground: true,
        radius: box / 2,
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
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    variants: {
      variant: {
        neutral: { backgroundColor: theme.colors.bg.surface },
        accent: { backgroundColor: theme.colors.accent.default },
        danger: { backgroundColor: theme.colors.feedback.danger },
        ghost: { backgroundColor: 'transparent' },
        glass: { backgroundColor: 'transparent' },
      },
      size: {
        md: { width: theme.sizing.iconButton, height: theme.sizing.iconButton },
        lg: { width: theme.sizing.minTouch, height: theme.sizing.minTouch },
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
