/**
 * Standard row: optional left slot, title + subtitle, optional trailing value and
 * a chevron when pressable (or any custom right accessory, e.g. a Switch).
 * size md = 56pt (settings rows), sm = 52pt (summary/form rows).
 * `inset` adds the 16pt side padding for free-standing lists; rows inside a
 * GroupedCard use inset={false}. docs/design-system.md §4.2.
 */
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon } from '@/shared/ui/Icon';
import { Text } from '@/shared/ui/Text';

export type ListItemSize = 'sm' | 'md';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  /** Muted title for label/value summary rows ("Профессия · Маникюр"). */
  titleTone?: 'primary' | 'secondary';
  /** Muted note inline after the title ("Категория · необязательно"). */
  titleNote?: string;
  /** Leading accessory — an avatar or icon. */
  left?: ReactNode;
  /** Trailing accessory — an icon, a switch, or any custom node. Wins over `trailingText`. */
  right?: ReactNode;
  /** Trailing value (e.g. "Бишкек, GMT+6"), shown before the chevron. */
  trailingText?: string;
  onPress?: () => void;
  showChevron?: boolean;
  size?: ListItemSize;
  inset?: boolean;
  accessibilityLabel?: string;
}

export function ListItem({
  title,
  subtitle,
  titleTone = 'primary',
  titleNote,
  left,
  right,
  trailingText,
  onPress,
  showChevron,
  size = 'md',
  inset = true,
  accessibilityLabel,
}: ListItemProps) {
  styles.useVariants({ size, inset });
  const pressable = !!onPress;
  const chevron = showChevron ?? pressable;

  const content = (
    <View style={styles.row}>
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={styles.body}>
        <Text variant="body" color={titleTone} numberOfLines={1}>
          {title}
          {titleNote ? (
            <Text variant="footnote" color="secondary">
              {` · ${titleNote}`}
            </Text>
          ) : null}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? (
        <View style={styles.trailing}>
          {trailingText ? (
            <Text variant="bodyStrong" numberOfLines={1}>
              {trailingText}
            </Text>
          ) : null}
          {chevron ? <Icon name="chevronRight" size="sm" color="content.tertiary" /> : null}
        </View>
      )}
    </View>
  );

  if (!pressable) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, trailingText].filter(Boolean).join(', ')}
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
    gap: theme.space[2.5],
    variants: {
      size: {
        sm: { minHeight: theme.sizing.row.sm },
        md: { minHeight: theme.sizing.row.md, paddingVertical: theme.space[2] },
      },
      inset: {
        true: { paddingHorizontal: theme.space[4] },
        false: {},
      },
    },
  },
  left: { justifyContent: 'center' },
  body: { flex: 1, minWidth: 0, gap: theme.space[0.25] },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2.5], flexShrink: 1 },
  pressed: { opacity: 0.6 },
}));
