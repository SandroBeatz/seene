/**
 * Reusable Stack header for the layout wrappers. Generalizes the proven
 * AuthModalHeader pattern: it's a custom node placed in the *native* Stack header
 * slot via `<Stack.Header asChild>`, so navigation positions it (and animates it
 * through transitions) while we still draw a gradient, glass, and a scroll-driven
 * title that native headers can't.
 *
 * Usage (PageLayout/ModalLayout compose this; a screen can do it directly):
 *
 *   <Stack.Header asChild>
 *     <ScreenHeader title="Settings" left={<IconButton icon="close" .../>} />
 *   </Stack.Header>
 *
 * The screen's options must enable a transparent native header so content scrolls
 * under it: `{ headerShown: true, headerTransparent: true }`.
 *
 * Title modes:
 *  - `static`  — the title is always visible in the bar (reference IMG_1015 "Настройки").
 *  - `collapse` — the bar title is hidden at rest and fades in after `collapseThreshold`
 *    px of scroll, for screens that show their own large title in the content
 *    (reference: the email auth screen). Drive it with `scrollY` from `useScrollFade`.
 *
 * We use the same scroll-driven collapse on iOS and Android instead of iOS's native
 * `headerLargeTitle`: native large title can't carry our gradient/slots and behaves
 * differently from Android, so a unified custom collapse keeps both platforms identical.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { GlassSurface } from '@/shared/ui/GlassSurface';
import { Text } from '@/shared/ui/Text';

const BAR_HEIGHT = 44;

/** Header background material. `glass` → Liquid Glass on iOS 26, tokened fallback otherwise. */
export type HeaderBackground = 'transparent' | 'scrim' | 'solid' | 'glass';

export interface ScreenHeaderProps {
  title?: string;
  /** `static` = always visible; `collapse` = fades in after `collapseThreshold` px. @default 'static' */
  titleMode?: 'static' | 'collapse';
  /** Scroll offset from `useScrollFade`. Required for `collapse` and for the `scrim` reveal. */
  scrollY?: SharedValue<number>;
  /** Scroll distance at which the collapsed title / scrim reach full opacity. @default 80 */
  collapseThreshold?: number;
  /** Header background material. @default 'transparent' */
  background?: HeaderBackground;
  /** Solid background color, or glass tint. Pass a theme token; defaults to bg.canvas for 'solid'. */
  color?: string;
  /** Reserve the top safe-area inset. Turn off when the header sits inside a sheet, not at the screen top. @default true */
  topInset?: boolean;
  /** Left slot (e.g. close / back / logo). */
  left?: ReactNode;
  /** Center slot. Overrides the `title` text when provided. */
  center?: ReactNode;
  /** Right slot (e.g. settings, actions). */
  right?: ReactNode;
}

export function ScreenHeader({
  title,
  titleMode = 'static',
  scrollY,
  collapseThreshold = 80,
  background = 'transparent',
  color,
  topInset = true,
  left,
  center,
  right,
}: ScreenHeaderProps) {
  // Subscribe to the theme so solid/scrim colors repaint on a theme change even on
  // frozen native tab screens (same reason Screen/Footer do it).
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const topPad = topInset ? insets.top : 0;

  const collapses = titleMode === 'collapse' && !!scrollY;
  const revealsOnScroll = background === 'scrim' && !!scrollY;

  // Scrim fades in across the whole scroll window; the title fades in over its back half
  // so it lands after the background, matching the email auth header feel.
  const bgStyle = useAnimatedStyle(() => {
    if (!revealsOnScroll || !scrollY) return { opacity: 1 };
    return { opacity: interpolate(scrollY.value, [0, collapseThreshold], [0, 1], Extrapolation.CLAMP) };
  });
  const titleStyle = useAnimatedStyle(() => {
    if (!collapses || !scrollY) return { opacity: 1, transform: [{ translateY: 0 }] };
    const start = collapseThreshold * 0.45;
    return {
      opacity: interpolate(scrollY.value, [start, collapseThreshold], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(scrollY.value, [start, collapseThreshold], [8, 0], Extrapolation.CLAMP) },
      ],
    };
  });

  const titleNode =
    center ??
    (title ? (
      <Animated.View pointerEvents="none" style={titleStyle}>
        <Text variant="headline" numberOfLines={1}>
          {title}
        </Text>
      </Animated.View>
    ) : null);

  return (
    <View
      style={[styles.root, { height: topPad + BAR_HEIGHT, paddingTop: topPad }]}
      pointerEvents="box-none">
      {background === 'glass' ? (
        <GlassSurface tintColor={color} style={styles.fill} pointerEvents="none" />
      ) : background === 'solid' ? (
        <View
          pointerEvents="none"
          style={[
            styles.fill,
            {
              backgroundColor: color ?? theme.colors.bg.canvas,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: theme.colors.border.subtle,
            },
          ]}
        />
      ) : background === 'scrim' ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fill,
            {
              // Transparent at the bottom, blending into the canvas at the very top.
              experimental_backgroundImage: `linear-gradient(to top, ${theme.colors.bg.canvas}00 0%, ${theme.colors.bg.canvas}F2 100%)`,
            },
            bgStyle,
          ]}
        />
      ) : null}

      <View style={styles.bar} pointerEvents="box-none">
        <View style={styles.sideStart}>{left}</View>
        <View style={styles.center} pointerEvents="box-none">
          {titleNode}
        </View>
        <View style={styles.sideEnd}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  // Placed in the Stack header slot (via <Stack.Header asChild>); navigation positions
  // it at the top, so no absolute positioning on the root itself.
  root: { justifyContent: 'flex-end' },
  fill: { ...StyleSheet.absoluteFillObject },
  bar: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.space[4],
  },
  sideStart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.space[2],
  },
  center: { flex: 2, alignItems: 'center', justifyContent: 'center' },
  sideEnd: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.space[2],
  },
}));
