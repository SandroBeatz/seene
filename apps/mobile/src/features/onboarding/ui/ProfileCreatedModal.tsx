/**
 * "Профиль создан" (design: AppTodayDone) — shown once over Today after onboarding:
 * a check that pops with a burst of confetti dots, what is left to fill in on the
 * booking page (avatar, cover, description, contacts), "Заполнить профиль · 2 мин"
 * and "Позже".
 *
 * The keyframes are the design's CSS ones as Reanimated CSS animations: the scrim
 * fades, the card rises, the check pops, the dots fly out. Reduced motion: no
 * motion, no dots.
 */
import { Modal, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  type CSSAnimationKeyframes,
  cubicBezier,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { motion } from '@/shared/theme/tokens';
import { Button, Icon, type IconName, Text } from '@/shared/ui';

const CHECK_SIZE = 76;
const DOT_COUNT = 10;
/**
 * Reanimated takes curves as cubicBezier() objects (a "cubic-bezier(…)" string
 * throws at runtime), but RN's ViewStyle types the timing function as a string —
 * hence the cast.
 */
const curve = (x1: number, y1: number, x2: number, y2: number) =>
  cubicBezier(x1, y1, x2, y2) as unknown as string;
const EASE_OUT = curve(...motion.easing.emphasized);
const BURST_EASE = curve(0.2, 0.7, 0.3, 1);

const fade: CSSAnimationKeyframes = { from: { opacity: 0 }, to: { opacity: 1 } };
const rise: CSSAnimationKeyframes = {
  from: { opacity: 0, transform: [{ translateY: 24 }, { scale: 0.96 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
};
const pop: CSSAnimationKeyframes = {
  '0%': { transform: [{ scale: 0 }] },
  '65%': { transform: [{ scale: 1.12 }] },
  '100%': { transform: [{ scale: 1 }] },
};

/** The design's burst: 10 dots around the check, three radii and sizes, squares on odd. */
const DOTS = Array.from({ length: DOT_COUNT }, (_, i) => {
  const angle = (i / DOT_COUNT) * Math.PI * 2 - Math.PI / 2;
  const radius = 62 + (i % 3) * 10;
  const size = 6 + (i % 3) * 2;
  const keyframes: CSSAnimationKeyframes = {
    '0%': { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 0.4 }] },
    '25%': { opacity: 1 },
    '100%': {
      opacity: 0,
      transform: [
        { translateX: Math.round(Math.cos(angle) * radius) },
        { translateY: Math.round(Math.sin(angle) * radius) },
        { scale: 1 },
      ],
    },
  };
  return { size, square: i % 2 === 1, delay: 0.42 + (i % 4) * 0.03, keyframes };
});
/** Dot colours, in the design's order: ink, rose, soft rose, ink, rose, grey, … */
const DOT_TONES = [
  'ink',
  'rose',
  'soft',
  'ink',
  'rose',
  'grey',
  'soft',
  'ink',
  'rose',
  'soft',
] as const;

const TODO: { key: string; icon: IconName }[] = [
  { key: 'avatar', icon: 'user' },
  { key: 'cover', icon: 'image' },
  { key: 'about', icon: 'text' },
  { key: 'contacts', icon: 'mapPin' },
];

export interface ProfileCreatedModalProps {
  visible: boolean;
  /** "Заполнить профиль · 2 мин". */
  onFillProfile: () => void;
  /** "Позже" (and the system back gesture). */
  onLater: () => void;
}

export function ProfileCreatedModal({ visible, onFillProfile, onLater }: ProfileCreatedModalProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const animate = (
    keyframes: CSSAnimationKeyframes,
    duration: number,
    delay: number,
    easing: string = EASE_OUT,
  ) =>
    reduceMotion
      ? null
      : ({
          animationName: keyframes,
          animationDuration: `${duration}ms`,
          animationTimingFunction: easing,
          animationDelay: `${delay}s`,
          animationFillMode: 'both',
        } as const);

  const dotColor = {
    ink: theme.colors.content.primary,
    rose: theme.colors.brand.default,
    soft: theme.colors.brand.soft,
    grey: theme.colors.border.dashed,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onLater}>
      <Animated.View style={[styles.scrim, animate(fade, 300, 0, 'ease')]} />
      <View
        style={[
          styles.frame,
          // The card sits under the Today header row, as in the design.
          {
            paddingTop: insets.top + theme.layout.topGap + theme.sizing.minTouch + theme.space[4.5],
          },
        ]}>
        <Animated.View
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={[styles.card, animate(rise, 500, 0.1)]}>
          <View style={styles.burst}>
            {reduceMotion
              ? null
              : DOTS.map((dot, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        width: dot.size,
                        height: dot.size,
                        left: (CHECK_SIZE - dot.size) / 2,
                        top: (CHECK_SIZE - dot.size) / 2,
                        borderRadius: dot.square ? 2 : dot.size / 2,
                        backgroundColor: dotColor[DOT_TONES[i]],
                      },
                      animate(dot.keyframes, 1100, dot.delay, BURST_EASE),
                    ]}
                  />
                ))}
            <Animated.View style={[styles.check, animate(pop, 550, 0.35)]}>
              <Icon name="check" size={34} weight="heavy" color="content.inverse" />
            </Animated.View>
          </View>

          <Text variant="title2" align="center" style={styles.title}>
            {t('today.profileCreated.title')}
          </Text>
          <Text variant="body" color="secondary" align="center" style={styles.text}>
            {t('today.profileCreated.text')}
          </Text>

          <View style={styles.grid}>
            {TODO.map((item) => (
              <View key={item.key} style={styles.todo}>
                <View style={styles.todoIcon}>
                  <Icon name={item.icon} size="sm" color="content.primary" />
                </View>
                <Text variant="subheadStrong" numberOfLines={1}>
                  {t(`today.profileCreated.todo.${item.key}`)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Button label={t('today.profileCreated.fill')} onPress={onFillProfile} />
            <Button
              label={t('today.profileCreated.later')}
              variant="ghost"
              tone="secondary"
              size="md"
              onPress={onLater}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay.scrimStrong },
  frame: { flex: 1, paddingHorizontal: theme.space[4] },
  card: {
    backgroundColor: theme.colors.bg.elevated,
    borderRadius: theme.radius.xxl,
    borderCurve: 'continuous',
    paddingTop: theme.space[7],
    paddingHorizontal: theme.space[5],
    paddingBottom: theme.space[4.5],
    alignItems: 'center',
    boxShadow: theme.shadow.dialog,
  },
  burst: { width: CHECK_SIZE, height: CHECK_SIZE },
  dot: { position: 'absolute' },
  check: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderRadius: CHECK_SIZE / 2,
    backgroundColor: theme.colors.content.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: theme.space[4.5] },
  text: { marginTop: theme.space[2] },
  grid: {
    marginTop: theme.space[4.5],
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
  },
  todo: {
    // Two per row: half the width minus half the 8pt gap.
    flexBasis: '48%',
    flexGrow: 1,
    height: 76,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.dashed,
    paddingHorizontal: theme.space[3.5],
    justifyContent: 'center',
    gap: theme.space[1.5],
  },
  todoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { marginTop: theme.space[4], alignSelf: 'stretch', gap: theme.space[1] },
}));
