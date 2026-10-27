/**
 * Wizard header: round back button, segmented progress, and an "N of M" counter.
 * Labels come from the caller so the kit stays i18n-free.
 *
 * Meant to stay mounted while steps change under it: the progress animates from
 * the previous step to the new one (each segment fills left to right, or empties
 * going back). Reduced motion jumps straight to the new state.
 */
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { motion } from '@/shared/theme/tokens';
import { IconButton } from '@/shared/ui/IconButton';
import { Text } from '@/shared/ui/Text';

export interface StepHeaderProps {
  /** 1-based current step. */
  step: number;
  total: number;
  /** e.g. "1 из 4". */
  counterLabel: string;
  onBack?: () => void;
  backLabel: string;
}

const EASING = Easing.bezier(...motion.easing.emphasized);

export function StepHeader({ step, total, counterLabel, onBack, backLabel }: StepHeaderProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(step);

  useEffect(() => {
    progress.value = reduceMotion
      ? step
      : withTiming(step, { duration: motion.duration.slow, easing: EASING });
  }, [progress, reduceMotion, step]);

  return (
    <View style={styles.row}>
      <IconButton
        icon="chevronLeft"
        variant="neutral"
        accessibilityLabel={backLabel}
        onPress={onBack}
      />
      <View style={styles.track} accessibilityElementsHidden importantForAccessibility="no">
        {Array.from({ length: total }, (_, index) => (
          <Segment key={index} index={index} progress={progress} />
        ))}
      </View>
      <Text variant="footnoteStrong" color="secondary" accessibilityRole="text">
        {counterLabel}
      </Text>
    </View>
  );
}

/** Segment `index` is full once progress ≥ index + 1, empty at ≤ index. */
function Segment({ index, progress }: { index: number; progress: SharedValue<number> }) {
  const fill = useAnimatedStyle(() => ({
    width: `${Math.min(1, Math.max(0, progress.value - index)) * 100}%`,
  }));
  return (
    <View style={styles.segment}>
      <Animated.View style={[styles.fill, fill]} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3.5] },
  track: { flex: 1, flexDirection: 'row', gap: theme.space[1.5] },
  segment: {
    flex: 1,
    height: theme.sizing.progress,
    borderRadius: theme.radius.bar,
    backgroundColor: theme.colors.border.default,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: theme.colors.accent.default },
}));
