/**
 * Welcome hero: the rounded photo with two floating cards — a WhatsApp reply and
 * the no-show stat. The cards sit on fixed white / ink surfaces (they are "UI over
 * a photo", not theme surfaces), so they look the same in light and dark.
 *
 * The float is a 6s ease-in-out loop of -6pt; the stat card runs half a cycle
 * ahead (the design's `animation-delay: -3s`). Off under reduced motion.
 */
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import Animated, { type CSSAnimationKeyframes, useReducedMotion } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { Icon, Text } from '@/shared/ui';
import heroPhoto from '@/shared/assets/img/welcome-hero.jpg';

const HERO_HEIGHT = 330;
const CHAT_MAX_WIDTH = 230;
const FLOAT_DISTANCE = -6;

const floatUp: CSSAnimationKeyframes = {
  '0%': { transform: [{ translateY: 0 }] },
  '50%': { transform: [{ translateY: FLOAT_DISTANCE }] },
  '100%': { transform: [{ translateY: 0 }] },
};
const floatDown: CSSAnimationKeyframes = {
  '0%': { transform: [{ translateY: FLOAT_DISTANCE }] },
  '50%': { transform: [{ translateY: 0 }] },
  '100%': { transform: [{ translateY: FLOAT_DISTANCE }] },
};

function floatStyle(keyframes: CSSAnimationKeyframes) {
  return {
    animationName: keyframes,
    animationDuration: '6s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
  } as const;
}

export function WelcomeHero() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <View style={styles.hero}>
      <Image
        source={heroPhoto}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition={{ left: '50%', top: '30%' }}
        accessibilityLabel={t('auth.welcome.heroAlt')}
      />
      <Animated.View style={[styles.chatAnchor, !reduceMotion && floatStyle(floatUp)]}>
        <View style={styles.chat}>
          <View style={styles.chatFrom}>
            <Icon name="chat" size="xs" color="constant.success" />
            <Text variant="caption2Strong" color="inkSuccess">
              {t('auth.welcome.chatFrom')}
            </Text>
          </View>
          <Text variant="subhead" color="ink">
            {t('auth.welcome.chatText')}
          </Text>
        </View>
      </Animated.View>
      <Animated.View
        style={[styles.stat, !reduceMotion && floatStyle(floatDown)]}
        accessible
        accessibilityLabel={`${t('auth.welcome.statLabel')}: ${t('auth.welcome.statValue')}`}>
        <Text variant="caption2" color="onDarkMuted">
          {t('auth.welcome.statLabel')}
        </Text>
        <Text variant="stat" color="white">
          {t('auth.welcome.statValue')}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  hero: {
    height: HERO_HEIGHT,
    borderRadius: theme.radius.xxl,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: theme.colors.bg.sunken,
  },
  // The float runs on this wrapper: a Reanimated CSS animation on the card itself
  // loses its per-corner radii on iOS (the bottom-right corner squared off).
  chatAnchor: {
    position: 'absolute',
    left: theme.space[4],
    bottom: 74,
    maxWidth: CHAT_MAX_WIDTH,
  },
  chat: {
    backgroundColor: theme.colors.constant.white,
    borderRadius: theme.radius.lg,
    borderBottomLeftRadius: theme.radius.xs,
    paddingVertical: theme.space[2.5],
    paddingHorizontal: theme.space[3],
    gap: theme.space[1],
    boxShadow: theme.shadow.bubble,
  },
  chatFrom: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1.5] },
  stat: {
    position: 'absolute',
    right: theme.space[4],
    bottom: theme.space[4.5],
    backgroundColor: theme.colors.constant.ink,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.space[2.5],
    paddingHorizontal: theme.space[3.5],
    gap: theme.space[0.5],
    boxShadow: theme.shadow.bubbleDark,
  },
}));
