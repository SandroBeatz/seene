/**
 * Badge / Pill + StatusPill.
 * StatusPill drives appointment status and is never color-only — it pairs the
 * status hue with a label (and a dot), per the a11y rule (docs/design-system.md §7).
 */
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { AppointmentStatusColorKey } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

const TONE_TEXT: Record<BadgeTone, 'secondary' | 'accent' | 'success' | 'warning' | 'danger'> = {
  neutral: 'secondary',
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  return (
    <View style={styles.badge}>
      <Text variant="caption" color={TONE_TEXT[tone]}>
        {label}
      </Text>
    </View>
  );
}

export interface StatusPillProps {
  status: AppointmentStatusColorKey;
  label: string;
}

export function StatusPill({ status, label }: StatusPillProps) {
  const { theme } = useUnistyles();
  const color = theme.status[status];
  return (
    <View style={styles.badge} accessibilityLabel={label}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="caption" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1],
    alignSelf: 'flex-start',
    paddingHorizontal: theme.space[2],
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bg.sunken,
  },
  dot: { width: 6, height: 6, borderRadius: theme.radius.full },
}));
