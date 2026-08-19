/**
 * Loading placeholder shaped like content (never a spinner over data). Shown on
 * `isPending` only. Respects Reduce Motion by falling back to a static block.
 * docs/design-system.md §6.
 */
import { useEffect } from 'react';
import { AccessibilityInfo, type DimensionValue, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { useReducedMotion } from '@/shared/ui/hooks/useReducedMotion';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
}

export function Skeleton({ width = '100%', height = 16, radius }: SkeletonProps) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: reduceMotion ? 0.6 : opacity.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.block, { width, height, borderRadius: radius ?? styles.block.borderRadius }, animatedStyle]}
    />
  );
}

/** N stacked skeleton rows for list first-load. */
export function SkeletonList({ rows = 6, rowHeight = 56 }: { rows?: number; rowHeight?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={rowHeight} radius={12} />
      ))}
    </View>
  );
}

// Keep the AccessibilityInfo import used (reduce-motion is read via the hook, but
// exporting a direct check is handy for one-offs).
export async function prefersReducedMotion(): Promise<boolean> {
  return AccessibilityInfo.isReduceMotionEnabled();
}

const styles = StyleSheet.create((theme) => ({
  block: { backgroundColor: theme.colors.bg.sunken, borderRadius: theme.radius.md },
  list: { gap: theme.space[2] },
}));
