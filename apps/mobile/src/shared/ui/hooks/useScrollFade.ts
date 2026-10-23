/**
 * Scroll-position source of truth for the layout wrappers. Wraps a single
 * Reanimated scroll handler and derives the edge-fade strengths, so both the
 * ScrollFade scrim and scroll-linked chrome (e.g. a collapsing header title,
 * Task app.master.seene-qlu) read from one shared value instead of each
 * attaching its own onScroll. Everything lives on the UI thread.
 */
import {
  clamp,
  type SharedValue,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

export interface ScrollFadeConfig {
  /** Scroll distance (px) over which each edge fade ramps between 0 and 1. @default 24 */
  fadeDistance?: number;
}

export interface ScrollFade {
  /** Spread onto an Animated.ScrollView/FlatList `onScroll` (pair with scrollEventThrottle={16}). */
  onScroll: ReturnType<typeof useAnimatedScrollHandler>;
  /** Raw vertical offset. Consumed by scroll-linked chrome such as a collapsing title. */
  scrollY: SharedValue<number>;
  /** Top edge fade strength, 0→1. Stays 0 at the very top so nothing dims when unscrolled. */
  topFade: SharedValue<number>;
  /** Bottom edge fade strength, 0→1. Drops to 0 once the content is scrolled to its end. */
  bottomFade: SharedValue<number>;
}

/**
 * Tracks a scroll view's offset and turns it into the two edge-fade strengths the
 * ScrollFade scrim renders. `bottomFade` starts at 1 (content is assumed scrollable
 * until the first scroll event proves otherwise), while `topFade` starts at 0.
 */
export function useScrollFade({ fadeDistance = 24 }: ScrollFadeConfig = {}): ScrollFade {
  const scrollY = useSharedValue(0);
  const topFade = useSharedValue(0);
  const bottomFade = useSharedValue(1);

  const onScroll = useAnimatedScrollHandler((event) => {
    const y = event.contentOffset.y;
    scrollY.value = y;
    topFade.value = clamp(y / fadeDistance, 0, 1);
    const distanceFromEnd = event.contentSize.height - event.layoutMeasurement.height - y;
    bottomFade.value = clamp(distanceFromEnd / fadeDistance, 0, 1);
  });

  return { onScroll, scrollY, topFade, bottomFade };
}
