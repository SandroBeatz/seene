/**
 * Avatar for list rows and profiles. Renders an image, or initials. Client initials
 * (`tone="hue"`) sit on one of the nine avatar gradients — the client's chosen
 * `color`, else a stable one from the name; the master's own (`tone="brand"`) on the
 * brand rose pair. docs/design-system.md §4.2.
 */
import { View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { AVATAR_GRADIENTS, avatarColorFor } from '@/shared/config/palettes';
import { Text } from '@/shared/ui/Text';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl';
export type AvatarTone = 'hue' | 'brand';

export interface AvatarProps {
  name?: string;
  /** `client.avatar_color` key; unset = derived from the name. */
  color?: string | null;
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

export function Avatar({ name, color, imageUrl, size = 'md', tone = 'hue' }: AvatarProps) {
  const { theme } = useUnistyles();
  const px = theme.sizing.avatar[size];
  const shape = { width: px, height: px, borderRadius: px / 2 };

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={[styles.base, shape]} contentFit="cover" />;
  }

  const initials = (
    <Text
      variant="bodyStrong"
      style={{
        fontSize: theme.sizing.avatarText[size],
        lineHeight: undefined,
        color: tone === 'brand' ? theme.colors.brand.strong : theme.colors.constant.white,
      }}>
      {initialsOf(name)}
    </Text>
  );

  if (tone === 'brand') {
    return (
      <View
        style={[styles.base, styles.centered, shape, { backgroundColor: theme.colors.brand.subtle }]}
        accessibilityLabel={name}>
        {initials}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={AVATAR_GRADIENTS[avatarColorFor(color, name ?? '')]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.base, styles.centered, shape]}
      accessibilityLabel={name}>
      {initials}
    </LinearGradient>
  );
}

const styles = StyleSheet.create(() => ({
  base: { overflow: 'hidden' },
  centered: { alignItems: 'center', justifyContent: 'center' },
}));
