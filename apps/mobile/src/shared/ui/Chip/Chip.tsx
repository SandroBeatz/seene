/**
 * Selectable pill (category filters, multi-select). Selected state uses the accent
 * subtle token + accent text; unselected is neutral.
 */
import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/ui/Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
  styles.useVariants({ selected });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
      <Text variant="subhead" color={selected ? 'accent' : 'secondary'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  chip: {
    paddingHorizontal: theme.space[3],
    paddingVertical: theme.space[1],
    borderRadius: theme.radius.full,
    borderWidth: 1,
    minHeight: theme.sizing.control.sm,
    justifyContent: 'center',
    variants: {
      selected: {
        true: {
          backgroundColor: theme.colors.accent.subtle,
          borderColor: theme.colors.accent.default,
        },
        false: {
          backgroundColor: theme.colors.bg.surface,
          borderColor: theme.colors.border.default,
        },
      },
    },
  },
  pressed: { opacity: 0.7 },
}));
