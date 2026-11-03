/** A direction's heading: its colour dot and name. */
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { fontFamily } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui';
import { directionColor } from '../lib/draft';

export function DirectionHeading({
  specialization,
  name,
}: {
  specialization: string | null;
  name: string;
}) {
  const { theme } = useUnistyles();
  const color = specialization ? directionColor(specialization) : theme.colors.content.tertiary;
  return (
    <View style={styles.root}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="headline" style={styles.name}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    marginTop: 22,
    marginHorizontal: theme.space[1],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { fontFamily: fontFamily.bold },
}));
