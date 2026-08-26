/**
 * The email auth screen's Stack header. Rendered into the native Stack header slot
 * via `<Stack.Header asChild>` (not a body overlay), but drawn custom because native
 * stack headers can't paint a gradient:
 *
 *  - At rest it's fully transparent — the big in-content title (from AuthForm) shows.
 *  - As the content scrolls up, a gradient scrim (transparent → canvas, no blur) and a
 *    compact centered title fade in, so the collapsed title reads over the content.
 *  - The ✕ close stays visible throughout (its own tonal circle).
 */
import { Pressable } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Icon, Text } from '@/shared/ui';

const BAR_HEIGHT = 44;

export interface AuthModalHeaderProps {
  title: string;
  scrollY: SharedValue<number>;
  onClose: () => void;
}

export function AuthModalHeader({ title, scrollY, onClose }: AuthModalHeaderProps) {
  const insets = useSafeAreaInsets();

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 48], [0, 1], Extrapolation.CLAMP),
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [28, 60], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [28, 60], [8, 0], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.root, { height: insets.top + BAR_HEIGHT, paddingTop: insets.top }]}>
      <Animated.View pointerEvents="none" style={[styles.scrim, scrimStyle]} />

      <Animated.View pointerEvents="none" style={[styles.titleWrap, titleStyle]}>
        <Text variant="headline" numberOfLines={1}>
          {title}
        </Text>
      </Animated.View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onClose}
        hitSlop={8}
        style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
        <Icon name="close" size="sm" color="content.secondary" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  // Placed in the Stack header slot (via <Stack.Header asChild>); navigation
  // positions it at the top, so no absolute positioning here.
  root: {
    justifyContent: 'center',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    // Transparent at the bottom, blending into the app canvas at the very top.
    experimental_backgroundImage: `linear-gradient(to top, ${theme.colors.bg.canvas}00 0%, ${theme.colors.bg.canvas}F2 100%)`,
  },
  titleWrap: {
    position: 'absolute',
    left: theme.space[10],
    right: theme.space[10],
    bottom: 0,
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: {
    position: 'absolute',
    right: theme.space[4],
    bottom: (BAR_HEIGHT - 30) / 2,
    width: 30,
    height: 30,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.elevated,
  },
  pressed: { opacity: 0.7 },
}));
