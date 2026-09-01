/**
 * Standard row for FlashList-backed lists: optional left slot, title + subtitle,
 * optional right accessory (defaults to a chevron when pressable). docs/design-system.md §4.2.
 */
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon } from '@/shared/ui/Icon';
import { Text } from '@/shared/ui/Text';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  /** Leading accessory — an avatar or icon. */
  left?: ReactNode;
  /** Trailing accessory — an icon, a switch, or any custom node. Wins over `trailingText`. */
  right?: ReactNode;
  /** Trailing text suffix (e.g. a price or count), shown before the chevron. */
  trailingText?: string;
  onPress?: () => void;
  showChevron?: boolean;
}

export function ListItem({
  title,
  subtitle,
  left,
  right,
  trailingText,
  onPress,
  showChevron,
}: ListItemProps) {
  const pressable = !!onPress;
  const chevron = showChevron ?? pressable;

  const content = (
    <View style={styles.row}>
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={styles.body}>
        <Text variant="body" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="footnote" color="secondary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.trailing}>
        {trailingText ? (
          <Text variant="subhead" color="secondary" numberOfLines={1}>
            {trailingText}
          </Text>
        ) : null}
        {right ?? (chevron ? <Icon name="chevronRight" size="sm" color="content.tertiary" /> : null)}
      </View>
    </View>
  );

  if (!pressable) return content;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[4],
    minHeight: theme.sizing.control.lg,
  },
  left: { justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  pressed: { backgroundColor: theme.colors.bg.sunken },
}));
