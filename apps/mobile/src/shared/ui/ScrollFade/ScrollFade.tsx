/**
 * Edge-fade scrim: the "content dissolves at the top and bottom" effect the layout
 * wrappers put over their scroll area (reference IMG_1014). It paints two gradient
 * bands — content fades into the theme background at each edge — whose strength is
 * driven by a `useScrollFade` result so the top band is absent when unscrolled and
 * the bottom band disappears at the end of the list.
 *
 * Render it as a sibling *after* the scroll view inside a relative parent; it never
 * intercepts touches. Omit the fade shared values to get static, always-on bands.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export interface ScrollFadeProps {
  /** Top-edge fade strength from `useScrollFade`. Static (always on) when omitted. */
  topFade?: SharedValue<number>;
  /** Bottom-edge fade strength from `useScrollFade`. Static (always on) when omitted. */
  bottomFade?: SharedValue<number>;
  /** Color the content dissolves into. Pass a theme token. @default theme.colors.bg.canvas */
  color?: string;
  /** Height of each fade band. @default theme.space[10] (40) */
  height?: number;
  /** Which edges to render. @default 'both' */
  edges?: 'top' | 'bottom' | 'both';
}

/** Same-color alpha stop — fading to literal `transparent` tints the edge black on iOS. */
function withAlpha(color: string, alpha: number): string {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color);
  if (!match) return color;
  let hex = match[1];
  if (hex.length === 3)
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ScrollFade({ topFade, bottomFade, color, height, edges = 'both' }: ScrollFadeProps) {
  const { theme } = useUnistyles();
  const solid = color ?? theme.colors.bg.canvas;
  const clear = withAlpha(solid, 0);
  const bandHeight = height ?? theme.space[10];

  const topStyle = useAnimatedStyle(() => ({ opacity: topFade ? topFade.value : 1 }));
  const bottomStyle = useAnimatedStyle(() => ({ opacity: bottomFade ? bottomFade.value : 1 }));

  const showTop = edges !== 'bottom';
  const showBottom = edges !== 'top';

  return (
    <View style={styles.overlay}>
      {showTop ? (
        <Animated.View style={[styles.band, styles.top, { height: bandHeight }, topStyle]}>
          <LinearGradient
            colors={[solid, clear]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradient}
          />
        </Animated.View>
      ) : null}
      {showBottom ? (
        <Animated.View style={[styles.band, styles.bottom, { height: bandHeight }, bottomStyle]}>
          <LinearGradient
            colors={[clear, solid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradient}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  // Fills the scroll area; never eats touches so the list underneath stays interactive.
  overlay: { ...StyleSheet.absoluteFillObject, pointerEvents: 'none' },
  band: { position: 'absolute', left: 0, right: 0, pointerEvents: 'none' },
  top: { top: 0 },
  bottom: { bottom: 0 },
  gradient: { flex: 1 },
}));
