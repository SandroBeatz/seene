/**
 * Avatar for list rows and profiles. Renders, in priority order: an image, an emoji,
 * or deterministic initials on a hue derived from the name (docs/design-system.md §4.2).
 */
import { Image, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { initialHueFor } from '@/shared/config/palettes';
import { Text } from '@/shared/ui/Text';

export interface AvatarProps {
  name?: string;
  emoji?: string | null;
  imageUrl?: string | null;
  size?: number;
}

function initialsOf(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function Avatar({ name, emoji, imageUrl, size = 40 }: AvatarProps) {
  const { theme } = useUnistyles();
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={[styles.base, shape]} />;
  }

  const background = name ? initialHueFor(name) : theme.colors.bg.sunken;

  return (
    <View style={[styles.base, styles.centered, shape, { backgroundColor: background }]}>
      {emoji ? (
        <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
      ) : (
        <Text variant="subhead" style={{ color: theme.colors.constant.white }}>
          {initialsOf(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  base: { overflow: 'hidden' },
  centered: { alignItems: 'center', justifyContent: 'center' },
}));
