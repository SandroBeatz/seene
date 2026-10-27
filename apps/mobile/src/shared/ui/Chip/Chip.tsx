/**
 * Selectable choice (duration presets, weekdays, filters). Selected = ink fill with
 * inverse text; idle = outlined. `dashed` is the "add / custom" affordance.
 * shape: md = 12pt radius (presets), field = 14pt radius (weekday row).
 */
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Text } from '@/shared/ui/Text';

export type ChipShape = 'md' | 'field';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  dashed?: boolean;
  shape?: ChipShape;
  /** Idle label in the muted tone (weekday row: days off read as greyed out). */
  mutedWhenIdle?: boolean;
  accessibilityLabel?: string;
}

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  dashed = false,
  shape = 'md',
  mutedWhenIdle = false,
  accessibilityLabel,
}: ChipProps) {
  styles.useVariants({ selected, dashed, shape });
  const labelColor = selected ? 'onAccent' : mutedWhenIdle ? 'tertiary' : 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
      <View style={styles.content}>
        {icon ? (
          <Icon name={icon} size="sm" color={selected ? 'accent.onAccent' : 'content.primary'} />
        ) : null}
        <Text variant="subheadStrong" color={labelColor} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  chip: {
    height: theme.sizing.control.md,
    paddingHorizontal: theme.space[2],
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      shape: {
        md: { borderRadius: theme.radius.md },
        field: { borderRadius: theme.radius.field },
      },
      selected: {
        true: {
          backgroundColor: theme.colors.accent.default,
          borderColor: theme.colors.accent.default,
        },
        false: {
          backgroundColor: theme.colors.bg.canvas,
          borderColor: theme.colors.border.default,
        },
      },
      dashed: { true: {}, false: {} },
    },
    compoundVariants: [
      {
        dashed: true,
        selected: false,
        styles: { borderStyle: 'dashed', borderColor: theme.colors.border.strong },
      },
    ],
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  pressed: { opacity: 0.7 },
}));
