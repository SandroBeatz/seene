/**
 * The bar under a step (design "Запись · N из 4"): what is chosen so far on the left
 * ("1 услуга · 3 200 сом", "2 ч · Наращивание ногтей") and the ink "Далее →" /
 * "Создать ✓" on the right, greyed until the step has an answer.
 */
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Icon, Text, type IconName } from '@/shared/ui';

export interface StepFooterProps {
  title: string;
  subtitle?: string;
  actionLabel: string;
  actionIcon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  onAction: () => void;
}

export function StepFooter({
  title,
  subtitle,
  actionLabel,
  actionIcon = 'chevronRight',
  disabled = false,
  loading = false,
  onAction,
}: StepFooterProps) {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, theme.space[4]) }]}>
      <View style={styles.summary}>
        <Text variant="bodyStrong" numberOfLines={1} tabularNums>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="footnote" color="tertiary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        accessibilityState={{ disabled, busy: loading }}
        disabled={disabled || loading}
        onPress={onAction}
        style={({ pressed }) => [
          styles.action,
          disabled && styles.actionOff,
          pressed && styles.pressed,
        ]}>
        {loading ? (
          <ActivityIndicator color={theme.colors.accent.onAccent} />
        ) : (
          <>
            <Text variant="bodyStrong" color="onAccent">
              {actionLabel}
            </Text>
            <Icon name={actionIcon} size="sm" color="accent.onAccent" />
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingTop: theme.space[3],
    paddingHorizontal: theme.space[4],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.bg.elevated,
  },
  summary: { flex: 1, minWidth: 0, gap: 2 },
  action: {
    minWidth: 118,
    height: theme.sizing.control.xl,
    paddingHorizontal: theme.space[5],
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2],
    backgroundColor: theme.colors.accent.default,
  },
  actionOff: { backgroundColor: theme.colors.border.strong },
  pressed: { opacity: 0.85 },
}));
