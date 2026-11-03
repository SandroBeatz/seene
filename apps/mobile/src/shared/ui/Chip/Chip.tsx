/**
 * Selectable choice (duration presets, weekdays, filters). Selected = ink fill with
 * inverse text; idle = outlined. `dashed` is the "add / custom" affordance.
 * shape: md = 12pt radius (presets), field = 14pt radius (weekday row), pill = round ends.
 */
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Text } from '@/shared/ui/Text';

export type ChipShape = 'md' | 'field' | 'pill';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  dashed?: boolean;
  /** Pressed in without being a choice: the "add" chip while its field is open. */
  active?: boolean;
  shape?: ChipShape;
  /** filter: 34pt with 13pt text (the menu's filter and choice chips). */
  size?: 'filter' | 'sm' | 'md';
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
  active = false,
  shape = 'md',
  size = 'md',
  mutedWhenIdle = false,
  accessibilityLabel,
}: ChipProps) {
  styles.useVariants({ selected, dashed, shape, active, size });
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
        <Text
          variant={size === 'filter' ? 'footnoteStrong' : 'subheadStrong'}
          color={labelColor}
          numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  chip: {
    paddingHorizontal: theme.space[2],
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      size: {
        filter: { height: 34 },
        sm: { height: theme.sizing.control.sm },
        md: { height: theme.sizing.control.md },
      },
      shape: {
        md: { borderRadius: theme.radius.md },
        field: { borderRadius: theme.radius.field },
        pill: { borderRadius: theme.radius.full, paddingHorizontal: theme.space[3.5] },
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
      active: {
        true: {
          borderWidth: 1.5,
          borderColor: theme.colors.accent.default,
          backgroundColor: theme.colors.bg.surface,
        },
        false: {},
      },
    },
    compoundVariants: [
      {
        dashed: true,
        selected: false,
        active: false,
        styles: { borderStyle: 'dashed', borderColor: theme.colors.border.strong },
      },
    ],
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  pressed: { opacity: 0.7 },
}));
