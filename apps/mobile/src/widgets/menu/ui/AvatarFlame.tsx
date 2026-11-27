/**
 * A barely-there fire around the menu's avatar: soft vector flame tongues in the brand
 * colour around the avatar's ring.
 *
 * Cheap on purpose: each layer's SVG (tongues + blur) is drawn once and cached as a
 * bitmap; only native transforms and opacity animate. Three layers with different tongue
 * patterns turn at different speeds and directions and breathe out of step, so where
 * they overlap the tongues seem to rise, fall and flicker. With Reduce Motion the fire
 * stands still.
 */
import { useEffect, useMemo } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, FeGaussianBlur, Filter, Path, RadialGradient, Stop } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useReducedMotion } from '@/shared/ui';

interface Layer {
  /** Tongues around the circle. */
  count: number;
  /** Shortest and tallest tongue, in pt above the base circle. */
  minHeight: number;
  maxHeight: number;
  /** Base width as a share of the gap between tongues; over 1 they overlap. */
  width: number;
  /** Picks this layer's tongue pattern. */
  seed: number;
  /** One full turn, ms; negative turns the other way. */
  turnMs: number;
  /** One breath (in and out), ms. */
  breathMs: number;
}

const LAYERS: Layer[] = [
  { count: 22, minHeight: 6, maxHeight: 18, width: 1.6, seed: 0, turnMs: 60000, breathMs: 3400 },
  { count: 16, minHeight: 4, maxHeight: 14, width: 1.9, seed: 2.3, turnMs: -46000, breathMs: 2600 },
  { count: 12, minHeight: 3, maxHeight: 9, width: 2.3, seed: 4.1, turnMs: 38000, breathMs: 2100 },
];
/** Flames start this far outside the avatar, under its canvas-coloured ring. */
const BASE_GAP = 3;
const REACH = 20;
/** Each layer's opacity swings between these: together "еле-еле видно". */
const OPACITY_LOW = 0.08;
const OPACITY_HIGH = 0.2;
const BLUR = 1.6;

/** One layer's tongues, frozen: heights and lean come from its seed. */
function flamesPath(center: number, base: number, layer: Layer): string {
  const half = (Math.PI / layer.count) * layer.width;
  const at = (angle: number, radius: number) =>
    `${(center + Math.cos(angle) * radius).toFixed(1)} ${(center + Math.sin(angle) * radius).toFixed(1)}`;
  let d = '';
  for (let i = 0; i < layer.count; i++) {
    const phase = i * 1.73 + layer.seed;
    const a = (i / layer.count) * Math.PI * 2 + layer.seed;
    // Two out-of-step sines give uneven heights around the circle.
    const mix = 0.6 * (0.5 + 0.5 * Math.sin(phase)) + 0.4 * (0.5 + 0.5 * Math.sin(phase * 2.3));
    const h = layer.minHeight + (layer.maxHeight - layer.minHeight) * mix;
    const tip = a + 0.22 * Math.sin(phase * 1.4);
    // Asymmetric sides so each tongue leans and curls like a flame, not a petal.
    d +=
      `M${at(a - half, base)}` +
      `C${at(a - half * 0.7, base + h * 0.45)} ${at(tip - half * 0.35, base + h * 0.7)} ${at(tip, base + h)}` +
      `C${at(tip + half * 0.1, base + h * 0.6)} ${at(a + half * 0.8, base + h * 0.3)} ${at(a + half, base)}Z`;
  }
  return d;
}

export function AvatarFlame({ size }: { size: number }) {
  const base = size / 2 + BASE_GAP;
  const reach = base + REACH;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.root,
        { width: reach * 2, height: reach * 2, top: size / 2 - reach, left: size / 2 - reach },
      ]}>
      {LAYERS.map((layer, index) => (
        <FlameLayer key={index} index={index} layer={layer} base={base} reach={reach} />
      ))}
    </Animated.View>
  );
}

function FlameLayer({
  index,
  layer,
  base,
  reach,
}: {
  index: number;
  layer: Layer;
  base: number;
  reach: number;
}) {
  const { theme } = useUnistyles();
  const reduceMotion = useReducedMotion();
  const turn = useSharedValue(0);
  const breath = useSharedValue(0.5);

  useEffect(() => {
    if (reduceMotion) return;
    turn.value = withRepeat(
      withTiming(1, { duration: Math.abs(layer.turnMs), easing: Easing.linear }),
      -1,
      false,
    );
    breath.value = withDelay(
      (layer.breathMs / LAYERS.length) * index,
      withRepeat(
        withTiming(1, { duration: layer.breathMs / 2, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [breath, index, layer, reduceMotion, turn]);

  const direction = Math.sign(layer.turnMs);
  const style = useAnimatedStyle(() => ({
    opacity: OPACITY_LOW + (OPACITY_HIGH - OPACITY_LOW) * breath.value,
    transform: [
      { rotate: `${direction * turn.value * 360}deg` },
      { scale: 0.96 + 0.08 * breath.value },
    ],
  }));

  const d = useMemo(() => flamesPath(reach, base, layer), [reach, base, layer]);
  const id = `avatarFlame${index}`;
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, style]}
      shouldRasterizeIOS
      renderToHardwareTextureAndroid>
      <Svg width={reach * 2} height={reach * 2}>
        <Defs>
          <Filter id={`${id}Blur`} x="-20%" y="-20%" width="140%" height="140%">
            <FeGaussianBlur stdDeviation={BLUR} />
          </Filter>
          <RadialGradient
            id={`${id}Fill`}
            cx={reach}
            cy={reach}
            r={reach}
            gradientUnits="userSpaceOnUse">
            <Stop offset={base / reach} stopColor={theme.colors.brand.default} stopOpacity={1} />
            <Stop offset={1} stopColor={theme.colors.brand.default} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Path d={d} fill={`url(#${id}Fill)`} filter={`url(#${id}Blur)`} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute' },
});
