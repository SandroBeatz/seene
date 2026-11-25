/**
 * Pull-to-refresh for "Сегодня". The native control does the physics (the hold
 * while loading, the ease back), so it feels like any iOS list; on iOS its own
 * spinner is hidden and `HeroPullIndicator` draws one under the hero sheet instead
 * (spokes with the pull, spinning once it fires; gone once done, until the next pull
 * from rest). UIRefreshControl's own trigger needs a long pull, so on iOS the refresh
 * starts earlier, at `PULL_TRIGGER`, and the control just follows `refreshing`.
 * Android shows its native circle.
 */
import { useCallback, useRef, useState } from 'react';
import { runOnJS, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { haptics } from '@/shared/lib/haptics';

/** How far to pull before it refreshes: the indicator's spokes are full by then. */
export const PULL_TRIGGER = 64;

const isIOS = process.env.EXPO_OS === 'ios';

export function useHeroPull(onRefresh: () => Promise<unknown>) {
  const scrollY = useSharedValue(0);
  const dragging = useSharedValue(false);
  // Fires once per pull: re-armed when the content is back at rest.
  const armed = useSharedValue(true);
  // A refresh ended while the content is still pulled: hide the spokes until it rests.
  const spent = useSharedValue(false);
  const [refreshing, setRefreshing] = useState(false);
  const running = useRef(false);

  const refresh = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setRefreshing(true);
    haptics.tap();
    try {
      await onRefresh();
    } finally {
      running.current = false;
      spent.set(true);
      setRefreshing(false);
    }
  }, [onRefresh, spent]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      scrollY.set(y);
      if (y >= 0) {
        if (spent.get()) spent.set(false);
        armed.set(true);
      }
      if (isIOS && dragging.get() && armed.get() && y <= -PULL_TRIGGER) {
        armed.set(false);
        runOnJS(refresh)();
      }
    },
    onBeginDrag: () => {
      dragging.set(true);
    },
    onEndDrag: () => {
      dragging.set(false);
    },
  });

  return { scrollY, spent, onScroll, refreshing, refresh };
}
