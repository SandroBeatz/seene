/**
 * Wizard header: round back button, segmented progress, and an "N of M" counter.
 * Labels come from the caller so the kit stays i18n-free.
 */
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
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

export function StepHeader({ step, total, counterLabel, onBack, backLabel }: StepHeaderProps) {
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
          <View key={index} style={[styles.segment, index < step && styles.segmentDone]} />
        ))}
      </View>
      <Text variant="footnoteStrong" color="secondary" accessibilityRole="text">
        {counterLabel}
      </Text>
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
  },
  segmentDone: { backgroundColor: theme.colors.accent.default },
}));
