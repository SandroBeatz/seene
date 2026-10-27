/**
 * Avatar for list rows and profiles. Renders, in priority order: an image, an emoji,
 * or initials. Initials sit on a hue derived from the name (`tone="hue"`, clients)
 * or on the brand rose pair (`tone="brand"`, the master's own avatar).
 * docs/design-system.md §4.2.
 */
import { View } from 'react-native';
import { Image } from 'expo-image';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { initialHueFor } from '@/shared/config/palettes';
import { Text } from '@/shared/ui/Text';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type AvatarTone = 'hue' | 'brand';

export interface AvatarProps {
  name?: string;
  emoji?: string | null;
  imageUrl?: string | null;
  size?: AvatarSize;
  tone?: AvatarTone;
}

export function initialsOf(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function Avatar({ name, emoji, imageUrl, size = 'md', tone = 'hue' }: AvatarProps) {
  const { theme } = useUnistyles();
  const px = theme.sizing.avatar[size];
  const shape = { width: px, height: px, borderRadius: px / 2 };

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={[styles.base, shape]} contentFit="cover" />;
  }

  const background =
    tone === 'brand'
      ? theme.colors.brand.subtle
      : name
        ? initialHueFor(name)
        : theme.colors.bg.sunken;
  const foreground = tone === 'brand' ? theme.colors.brand.strong : theme.colors.constant.white;

  return (
    <View
      style={[styles.base, styles.centered, shape, { backgroundColor: background }]}
      accessibilityLabel={name}>
      {emoji ? (
        <Text style={{ fontSize: px * 0.5 }}>{emoji}</Text>
      ) : (
        <Text
          variant="bodyStrong"
          style={{
            fontSize: theme.sizing.avatarText[size],
            lineHeight: undefined,
            color: foreground,
          }}>
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
