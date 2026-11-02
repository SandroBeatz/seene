/**
 * A tappable fact in a preview sheet (design "Запись · превью"): an icon, an optional
 * caption, the title and subtitle, and a chevron to where it gets changed.
 */
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Text } from '@/shared/ui/Text';

export interface InfoRowProps {
  icon: IconName;
  /** Small caption above the title (the note's "Заметка"). */
  caption?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  accessibilityLabel?: string;
  onPress: () => void;
}

export function InfoRow({
  icon,
  caption,
  title,
  subtitle,
  accessibilityLabel,
  onPress,
}: InfoRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Icon name={icon} size="md" color="content.tertiary" />
      <View style={styles.grow}>
        {caption ? (
          <Text variant="caption" color="tertiary">
            {caption}
          </Text>
        ) : null}
        {title}
        {subtitle}
      </View>
      <Icon name="chevronRight" size="sm" color="content.disabled" />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    padding: theme.space[3.5],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.block,
    backgroundColor: theme.colors.bg.elevated,
  },
  pressed: { opacity: 0.7 },
  grow: { flex: 1, minWidth: 0, gap: 2 },
}));
