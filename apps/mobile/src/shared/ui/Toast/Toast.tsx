/**
 * The toast on top of the app (design "Тосты"): a dark card with a round mark, what happened
 * and, at most, one thing to do about it. Goes by itself, by its cross or by a swipe up.
 * Mounted once, after the root Stack: native bars draw above any screen's content.
 */
import { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeInUp,
  FadeOutUp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';
import { StyleSheet } from 'react-native-unistyles';
import { Icon, type IconName } from '../Icon';
import { Text } from '../Text';
import {
  dismissToast,
  toastDuration,
  useToastStore,
  type ShownToast,
  type ToastAction,
  type ToastTone,
} from './toast.store';

const EXIT_MS = 180;
/** Up this far, or flicked this fast, and it goes; otherwise it settles back. */
const SWIPE_DISTANCE = 24;
const SWIPE_VELOCITY = 500;
const SWIPE_OFF = -240;

// A short settle from just above, no spring: the toast confirms, it doesn't bounce.
const ENTERING = FadeInUp.duration(280)
  .easing(Easing.out(Easing.cubic))
  .withInitialValues({
    opacity: 0,
    transform: [{ translateY: -12 }],
  });
const EXITING = FadeOutUp.duration(EXIT_MS);

const TONE_ICON: Record<ToastTone, IconName> = {
  success: 'check',
  neutral: 'check',
  danger: 'error',
};

/**
 * An iOS form sheet covers everything in the app's own view tree: the toast takes its own
 * layer above it. Other platforms show the modals in that tree, so it is already on top.
 */
const Layer = Platform.OS === 'ios' ? FullWindowOverlay : Fragment;

export function Toaster() {
  const insets = useSafeAreaInsets();
  const toast = useToastStore((s) => s.toast);
  // The layer goes on top when it mounts, so each toast gets its own: a sheet opened since
  // the last one would cover it. It outlives the toast a moment for the card to leave.
  const [layerId, setLayerId] = useState<number | null>(null);
  if (toast && layerId !== toast.id) setLayerId(toast.id);

  useEffect(() => {
    if (toast) return;
    const timer = setTimeout(() => setLayerId(null), EXIT_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  if (layerId === null) return null;

  return (
    <Layer key={layerId}>
      {/* Gestures need their own root inside the overlay; only the card's size, so the
          rest of the screen keeps its touches. */}
      <GestureHandlerRootView style={[styles.wrap, { top: insets.top + 8 }]}>
        {toast ? <ToastCard key={toast.id} toast={toast} /> : null}
      </GestureHandlerRootView>
    </Layer>
  );
}

/**
 * Runs on the UI thread. A named worklet, not an inline callback: this one closes over nothing
 * of the component, so React Compiler would lift it out as a plain JS function and it would crash.
 */
function dismissWhenOff(finished?: boolean) {
  'worklet';
  if (finished) runOnJS(dismissToast)();
}

function ToastCard({ toast }: { toast: ShownToast }) {
  const { t } = useTranslation();
  const [held, setHeld] = useState(false);
  const offset = useSharedValue(0);
  const duration = toastDuration(toast);

  // It doesn't leave from under a finger.
  useEffect(() => {
    if (held) return;
    const timer = setTimeout(dismissToast, duration);
    return () => clearTimeout(timer);
  }, [held, duration]);

  const swipe = Gesture.Pan()
    .activeOffsetY(-6)
    .failOffsetY(6)
    .onStart(() => {
      runOnJS(setHeld)(true);
    })
    .onChange((event) => {
      offset.value = Math.min(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY < -SWIPE_DISTANCE || event.velocityY < -SWIPE_VELOCITY) {
        offset.value = withTiming(SWIPE_OFF, { duration: EXIT_MS }, dismissWhenOff);
      } else {
        offset.value = withTiming(0, { duration: EXIT_MS });
        runOnJS(setHeld)(false);
      }
    });

  const followFinger = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));

  const press = (action: ToastAction) => () => {
    dismissToast();
    action.onPress();
  };

  return (
    <Animated.View entering={ENTERING} exiting={EXITING} accessibilityLiveRegion="polite">
      <GestureDetector gesture={swipe}>
        <Animated.View style={[styles.card, followFinger]}>
          <View style={styles.row}>
            <View style={[styles.mark, styles[toast.tone ?? 'success']]}>
              <Icon
                name={toast.icon ?? TONE_ICON[toast.tone ?? 'success']}
                size={16}
                color="constant.white"
              />
            </View>
            <View style={styles.text}>
              <Text variant="bodyStrong" color="white" numberOfLines={1}>
                {toast.title}
              </Text>
              {toast.summary ? (
                <Text variant="footnote" color="onDarkMuted" tabularNums numberOfLines={1}>
                  {toast.summary}
                </Text>
              ) : null}
            </View>
            {toast.action ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={press(toast.action)}
                style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
                <Text variant="subheadStrong" style={styles.actionLabel}>
                  {toast.action.label}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                hitSlop={6}
                onPress={dismissToast}
                style={styles.close}>
                <Icon name="close" size={16} color="content.onDarkMuted" />
              </Pressable>
            )}
          </View>
          {toast.cta ? (
            <Pressable
              accessibilityRole="button"
              onPress={press(toast.cta)}
              style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
              {toast.cta.icon ? <Icon name={toast.cta.icon} size="md" /> : null}
              <Text variant="subheadStrong" color="ink">
                {toast.cta.label}
              </Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: { position: 'absolute', left: theme.space[3], right: theme.space[3], zIndex: 10 },
  card: {
    gap: 10,
    padding: theme.space[3],
    borderRadius: 22,
    backgroundColor: theme.colors.constant.ink,
    boxShadow: theme.shadow.bubble,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  success: { backgroundColor: theme.colors.constant.success },
  neutral: { backgroundColor: theme.colors.constant.toastNeutral },
  danger: { backgroundColor: theme.colors.constant.toastDanger },
  text: { flex: 1, minWidth: 0, gap: 1 },
  close: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  action: { height: 32, paddingHorizontal: 10, justifyContent: 'center' },
  actionLabel: { color: theme.colors.constant.toastAction },
  cta: {
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2],
    backgroundColor: theme.colors.constant.white,
  },
  pressed: { opacity: 0.85 },
}));
