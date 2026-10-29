/**
 * Toggle drawn from tokens (accent track on, neutral track off) instead of the
 * platform switch, so it looks the same on iOS and Android as in the design.
 * The knob is white, and takes the on-accent colour when on: in dark the accent
 * track is near-white, so the knob turns ink to stay visible.
 * Sizes: md 50×30 (settings rows), sm 46×27 (dense per-day rows).
 */
import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useReducedMotion } from '@/shared/ui/hooks/useReducedMotion';

export type SwitchSize = 'md' | 'sm';

export interface SwitchProps {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  size?: SwitchSize;
  accessibilityLabel?: string;
}

export function Switch({
  value,
  onValueChange,
  disabled = false,
  size = 'md',
  accessibilityLabel,
}: SwitchProps) {
  const { theme } = useUnistyles();
  const reduceMotion = useReducedMotion();
  const dims = theme.sizing.switch[size];
  const travel = dims.width - dims.knob - dims.padding * 2;
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    const target = value ? 1 : 0;
    progress.value = reduceMotion
      ? target
      : withTiming(target, { duration: theme.motion.duration.base });
  }, [progress, reduceMotion, theme.motion.duration.base, value]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * travel }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={(theme.sizing.minTouch - dims.height) / 2}
      onPress={() => onValueChange?.(!value)}
      style={[
        styles.track,
        {
          width: dims.width,
          height: dims.height,
          padding: dims.padding,
          backgroundColor: value ? theme.colors.accent.default : theme.colors.control.trackOff,
        },
        disabled && styles.disabled,
      ]}>
      <Animated.View
        style={[
          styles.knob,
          {
            width: dims.knob,
            height: dims.knob,
            backgroundColor: value ? theme.colors.accent.onAccent : theme.colors.control.knob,
          },
          knobStyle,
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  track: {
    borderRadius: theme.radius.full,
    justifyContent: 'center',
  },
  knob: {
    borderRadius: theme.radius.full,
    boxShadow: theme.shadow.knob,
  },
  disabled: { opacity: 0.5 },
}));
