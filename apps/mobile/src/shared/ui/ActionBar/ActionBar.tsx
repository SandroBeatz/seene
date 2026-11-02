/**
 * The floating bar of a preview sheet (design "Запись · превью"): the ink pill with the
 * main action and, when there are any, quieter actions on its sides on a glass capsule.
 * A lone main action floats on its own.
 */
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { GlassSurface } from '@/shared/ui/GlassSurface';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Text } from '@/shared/ui/Text';

export interface ActionBarItem {
  label: string;
  icon: IconName;
  /** Red: cancels or removes something. */
  danger?: boolean;
  onPress: () => void;
}

export interface ActionBarProps {
  start?: ActionBarItem | null;
  primary?: ActionBarItem | null;
  end?: ActionBarItem | null;
  disabled?: boolean;
  /** Distance from the sheet's bottom edge. */
  bottom: number;
}

const BAR_HEIGHT = 68;

export function ActionBar({ start, primary, end, disabled = false, bottom }: ActionBarProps) {
  const hasSides = !!start || !!end;

  const side = (item: ActionBarItem | null | undefined) =>
    item ? (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={item.onPress}
        style={({ pressed }) => [styles.side, pressed && styles.pressed]}>
        <Icon
          name={item.icon}
          size="md"
          color={item.danger ? 'tone.danger.fg' : 'content.primary'}
        />
        <Text variant="caption2Medium" style={item.danger ? styles.dangerText : undefined}>
          {item.label}
        </Text>
      </Pressable>
    ) : (
      <View style={styles.side} />
    );

  return (
    <View style={[styles.wrap, { bottom }]} pointerEvents="box-none">
      {hasSides ? <GlassSurface style={styles.glass} pointerEvents="none" /> : null}
      <View style={[styles.row, !hasSides && styles.rowAlone]} pointerEvents="box-none">
        {hasSides ? side(start) : null}
        {primary ? (
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            onPress={primary.onPress}
            style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}>
            <Icon name={primary.icon} size="base" color="accent.onAccent" />
            <Text variant="bodyStrong" color="onAccent">
              {primary.label}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.gap} />
        )}
        {hasSides ? side(end) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: {
    position: 'absolute',
    left: theme.space[4],
    right: theme.space[4],
    height: BAR_HEIGHT,
  },
  glass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BAR_HEIGHT / 2,
    boxShadow: theme.shadow.tabBar,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1],
    paddingHorizontal: theme.space[1.5],
  },
  rowAlone: { justifyContent: 'center' },
  side: {
    flex: 1,
    height: theme.sizing.row.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[1],
  },
  pressed: { opacity: 0.7 },
  dangerText: { color: theme.colors.tone.danger.fg },
  gap: { width: theme.space[6] },
  primary: {
    height: theme.sizing.row.md,
    paddingHorizontal: theme.space[6.5],
    borderRadius: theme.sizing.row.md / 2,
    backgroundColor: theme.colors.accent.default,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    boxShadow: theme.shadow.pop,
  },
  primaryPressed: { backgroundColor: theme.colors.accent.pressed },
}));
