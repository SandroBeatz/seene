/**
 * Photo tile on step 2: the profession photo with a bottom shade, its name in white
 * and a round mark top-right. Selected = a ring in the section's colour inside a white
 * ring, drawn with inset shadows so the tile keeps its size.
 */
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native-unistyles';
import { SelectionMark, Text } from '@/shared/ui';

export interface ProfessionTileProps {
  label: string;
  /** Metro asset id. */
  image: number;
  /** The section's colour (hex) for the selected ring. */
  color: string;
  selected: boolean;
  onPress: () => void;
}

export function ProfessionTile({ label, image, color, selected, onPress }: ProfessionTileProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      <View style={styles.shade} />
      <View style={styles.mark}>
        <SelectionMark checked={selected} shape="circle" tone="onImage" />
      </View>
      <Text variant="tile" color="white" style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      {selected ? <View style={styles.ring(color)} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  tile: {
    flex: 1,
    height: theme.sizing.tile,
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: theme.colors.bg.sunken,
  },
  // Bottom 70%: black 60% → transparent, so the white label always reads.
  shade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    pointerEvents: 'none',
    experimental_backgroundImage: `linear-gradient(to top, ${theme.colors.overlay.photoShade}, transparent)`,
  },
  mark: { position: 'absolute', top: theme.space[2.5], right: theme.space[2.5] },
  label: {
    position: 'absolute',
    left: theme.space[3.5],
    right: theme.space[3.5],
    bottom: theme.space[3],
  },
  ring: (color: string) => ({
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.radius.xl,
    pointerEvents: 'none',
    boxShadow: `inset 0 0 0 3px ${color}, inset 0 0 0 5px ${theme.colors.constant.white}`,
  }),
  pressed: { transform: [{ scale: 0.98 }] },
}));
