/** A square photo in the grid: its caption and, on the first one, the cover mark. */
import { Image } from 'expo-image';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/ui';

export function PhotoTile({
  uri,
  size,
  caption,
  coverLabel,
}: {
  uri: string;
  size: number;
  caption?: string | null;
  coverLabel?: string;
}) {
  return (
    <View style={[styles.tile, { width: size, height: size }]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      {coverLabel ? (
        <View style={[styles.pill, styles.cover]}>
          <Text variant="caption2Strong" color="onAccent" numberOfLines={1}>
            {coverLabel}
          </Text>
        </View>
      ) : null}
      {caption ? (
        <View style={[styles.pill, styles.caption]}>
          <Text variant="caption2Strong" numberOfLines={1}>
            {caption}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const PILL_INSET = 6;

const styles = StyleSheet.create((theme) => ({
  tile: {
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.bg.surface,
  },
  pill: {
    position: 'absolute',
    left: PILL_INSET,
    maxWidth: '85%',
    height: 20,
    paddingHorizontal: 7,
    borderRadius: 10,
    justifyContent: 'center',
  },
  cover: { top: PILL_INSET, backgroundColor: theme.colors.accent.default },
  caption: { bottom: PILL_INSET, backgroundColor: theme.colors.bg.elevated },
}));
