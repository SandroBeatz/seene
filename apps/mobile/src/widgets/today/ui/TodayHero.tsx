/**
 * "Сегодня" hero: a sheet behind the transparent native header — light theme: a warm
 * sheet with a pink and a lavender wash, the summary on a white glass card (design
 * "Сегодня · шапка: светлый градиент и стекло"); dark: ink with a rose and a violet
 * glow (design "…шапка: чёрная с розовым свечением"). Behind it, the native header (`TodayHeader`:
 * avatar, greeting, analytics, notifications — Liquid Glass on iOS 26), and under it
 * the day summary (earned against the plan, one segment per visit) → analytics.
 *
 * Scroll-linked: as the content scrolls up, the sheet slides up with it (a transform,
 * no relayout per frame) until only the header part is left, the summary fading out.
 * Pulled down, the sheet stays put: the content moves away from it and the
 * pull-to-refresh spinner (`HeroPullIndicator`) shows in the gap under the sheet —
 * its spokes fill in with the pull and it spins only once the refresh fires, like
 * UIRefreshControl (the pull itself: `useHeroPull`).
 * Everything runs on the UI thread.
 */
import { router } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, type LayoutChangeEvent, Pressable, View } from 'react-native';
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { isSupportedLocale, pluralCategory } from '@/shared/lib/i18n';
import { Text, useReducedMotion } from '@/shared/ui';
import type { DaySummary } from '../model/summary';
import { PULL_TRIGGER } from './useHeroPull';

export interface TodayHeroProps {
  /** "Вт, 27 октября". */
  dateLabel: string;
  /** null while the day loads: the summary keeps its place, without figures. */
  summary: DaySummary | null;
  /** Formats a number without the currency ("3 600"). */
  formatNumber: (amount: number) => string;
  currency: string;
  /** The content's vertical offset. */
  scrollY: SharedValue<number>;
  /** The expanded height, for the content's top inset. */
  onHeight: (height: number) => void;
}

export function TodayHero({
  dateLabel,
  summary,
  formatNumber,
  currency,
  scrollY,
  onHeight,
}: TodayHeroProps) {
  const { theme } = useUnistyles();
  const reducedMotion = useReducedMotion();
  // The pinned part is the native header (status bar included).
  const headerHeight = useHeaderHeight();
  const summaryHeight = useSharedValue(0);
  const [measuredSummary, setMeasuredSummary] = useState(0);

  const padBottom = theme.space[5.5];
  const summaryGap = theme.space[4.5];

  useEffect(() => {
    if (measuredSummary) onHeight(headerHeight + summaryGap + measuredSummary + padBottom);
  }, [headerHeight, measuredSummary, onHeight, padBottom, summaryGap]);

  const range = useDerivedValue(() => summaryGap + summaryHeight.value);

  // Scrolled up: the whole sheet slides up by the summary's room, so only the header
  // part stays. Pulled down (negative offset): it does not move at all.
  const travel = useDerivedValue(() => Math.min(Math.max(scrollY.value, 0), range.value));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -travel.value }],
  }));

  const summaryStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion
      ? 1
      : interpolate(travel.value, [range.value * 0.35, range.value], [1, 0], 'clamp'),
  }));

  const background = {
    experimental_backgroundImage: theme.colors.hero.image,
    backgroundColor: theme.colors.hero.bg,
  };

  return (
    // The gradient sits on a static child, not on the animated view: a background image
    // on a view Reanimated moves lags behind it (a ghost of the sheet on dark).
    <Animated.View style={[styles.sheet, sheetStyle]}>
      <View style={[StyleSheet.absoluteFill, background]} pointerEvents="none" />
      <View style={{ height: headerHeight }} />

      <Animated.View
        style={[{ marginTop: summaryGap }, summaryStyle]}
        onLayout={(e: LayoutChangeEvent) => {
          const height = e.nativeEvent.layout.height;
          if (height === summaryHeight.value) return;
          summaryHeight.value = height;
          setMeasuredSummary(height);
        }}>
        <Summary
          dateLabel={dateLabel}
          summary={summary}
          formatNumber={formatNumber}
          currency={currency}
        />
      </Animated.View>
    </Animated.View>
  );
}

export interface HeroPullIndicatorProps {
  /** The sheet's bottom edge: the spinner lives in the gap the pull opens under it. */
  top: number;
  /** The content's resting gap under the sheet. */
  gap: number;
  scrollY: SharedValue<number>;
  /** Pull-to-refresh running: the spinner stays while the content holds the pull. */
  refreshing: boolean;
  /** A refresh finished during this pull: no spokes until the content is let go. */
  spent: SharedValue<boolean>;
}

/**
 * The pull-to-refresh spinner for "Сегодня", in the content area under the hero
 * sheet: centred in the gap between the sheet and the pulled content.
 */
export function HeroPullIndicator({ top, gap, scrollY, refreshing, spent }: HeroPullIndicatorProps) {
  const { theme } = useUnistyles();
  const style = useAnimatedStyle(() => {
    const pull = Math.max(-scrollY.value, 0);
    return {
      opacity: pull > 0 || refreshing ? 1 : 0,
      transform: [{ translateY: Math.max((gap + pull - SPINNER) / 2, 0) }],
    };
  });
  return (
    <Animated.View style={[styles.spinner, { top }, style]} pointerEvents="none">
      {refreshing ? (
        <ActivityIndicator color={theme.colors.content.secondary} />
      ) : (
        <PullSpokes scrollY={scrollY} spent={spent} />
      )}
    </Animated.View>
  );
}

const SPOKES = 8;
/** Pull distance where the first spoke shows; the last one lands on the trigger. */
const SPOKES_FROM = 14;

/** UIActivityIndicator's spokes, drawn one by one as the pull grows. */
function PullSpokes({
  scrollY,
  spent,
}: {
  scrollY: SharedValue<number>;
  spent: SharedValue<boolean>;
}) {
  const fade = useAnimatedStyle(() => ({
    opacity: withTiming(spent.value ? 0 : 1, { duration: spent.value ? 180 : 0 }),
  }));
  return (
    <Animated.View style={[styles.spokes, fade]}>
      {Array.from({ length: SPOKES }, (_, index) => (
        <Spoke key={index} index={index} scrollY={scrollY} />
      ))}
    </Animated.View>
  );
}

function Spoke({ index, scrollY }: { index: number; scrollY: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const progress = (-scrollY.value - SPOKES_FROM) / (PULL_TRIGGER - SPOKES_FROM);
    return { opacity: progress * SPOKES > index ? 1 - index * 0.07 : 0 };
  });
  return (
    <Animated.View
      style={[styles.spokeArm, { transform: [{ rotate: `${(index * 360) / SPOKES}deg` }] }, style]}>
      <View style={styles.spoke} />
    </Animated.View>
  );
}

function Summary({
  dateLabel,
  summary,
  formatNumber,
  currency,
}: Pick<TodayHeroProps, 'dateLabel' | 'summary' | 'formatNumber' | 'currency'>) {
  const { t, i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const count = summary?.count ?? 0;
  const visitsWord = t(`today.visits_${pluralCategory(count, locale)}`);
  const segments = summary?.segments ?? [];
  const passed = segments.filter((s) => s === 'done').length;
  const current = segments.filter((s) => s === 'now').length;
  const figure = (n: number | undefined) => (n === undefined ? '—' : formatNumber(n));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={t('today.summaryHint')}
      disabled={!summary}
      onPress={() => router.push('/analytics')}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.dateRow}>
        <Text variant="footnoteStrong" accessibilityRole="header" style={styles.muted}>
          {t('tabs.today')}
        </Text>
        <Text variant="footnote" style={styles.muted}>
          {dateLabel}
        </Text>
      </View>

      <View style={styles.figures}>
        <View
          style={styles.earned}
          accessible
          accessibilityLabel={
            summary
              ? t('today.earnedA11y', {
                  earned: formatNumber(summary.earned),
                  planned: formatNumber(summary.planned),
                  currency,
                })
              : undefined
          }>
          <View style={styles.line}>
            <Text variant="figure" tabularNums numberOfLines={1} style={[styles.fg, styles.shrink]}>
              {figure(summary?.earned)}{' '}
              <Text variant="footnoteStrong" style={styles.fg}>
                {currency}
              </Text>
            </Text>
            <Text variant="caption" tabularNums numberOfLines={1} style={styles.muted}>
              {t('today.ofPlanned', { amount: figure(summary?.planned) })}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(summary?.progress ?? 0) * 100}%` }]} />
          </View>
        </View>

        <View
          style={styles.visits}
          accessible
          accessibilityLabel={
            summary
              ? t('today.segmentsA11y', {
                  count,
                  visits: visitsWord,
                  passed,
                  current,
                  ahead: count - passed - current,
                })
              : undefined
          }>
          <Text variant="figure" tabularNums numberOfLines={1} style={styles.fg}>
            {summary ? count : '—'}{' '}
            <Text variant="footnoteStrong" style={styles.fg}>
              {visitsWord}
            </Text>
          </Text>
          <View style={styles.segments}>
            {segments.length === 0 ? (
              <View style={[styles.segment, styles.ahead]} />
            ) : (
              segments.map((segment, index) => (
                <View
                  // Positional: one per visit in start order.
                  key={index}
                  style={[
                    styles.segment,
                    segment === 'done' && styles.done,
                    segment === 'now' && styles.now,
                    segment === 'ahead' && styles.ahead,
                  ]}
                />
              ))
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const BAR = 5;
/** UIActivityIndicator (medium) size. */
const SPINNER = 20;
/** The sheet's bottom corners (design 28, rounder on request). */
const RADIUS = 36;

const styles = StyleSheet.create((theme) => ({
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    overflow: 'hidden',
    paddingHorizontal: theme.space[5],
    paddingBottom: theme.space[5.5],
    borderBottomLeftRadius: RADIUS,
    borderBottomRightRadius: RADIUS,
    borderCurve: 'continuous',
  },
  spinner: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    height: SPINNER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spokes: { width: SPINNER, height: SPINNER },
  // Each arm spans the spinner and is rotated; the spoke sits at its top.
  spokeArm: { ...StyleSheet.absoluteFillObject, alignItems: 'center' },
  spoke: {
    marginTop: 1,
    width: 2.5,
    height: 6,
    borderRadius: 1.25,
    backgroundColor: theme.colors.content.secondary,
  },
  fg: { color: theme.colors.hero.fg },
  muted: { color: theme.colors.hero.muted },
  pressed: { opacity: 0.7 },
  // Light: a white glass card (padding only where it shows); dark: the bare sheet.
  card: {
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.hero.card,
    boxShadow: theme.colors.hero.cardShadow,
    padding: theme.colors.hero.card === 'transparent' ? 0 : theme.space[3.5],
    paddingHorizontal: theme.colors.hero.card === 'transparent' ? 0 : theme.space[4],
  },
  dateRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  figures: { flexDirection: 'row', gap: theme.space[3.5], marginTop: theme.space[2.5] },
  earned: { flex: 1.3, gap: theme.space[2], justifyContent: 'space-between' },
  visits: {
    flex: 1,
    gap: theme.space[2],
    justifyContent: 'space-between',
    paddingLeft: theme.space[3.5],
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.hero.divider,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.space[1.5],
  },
  shrink: { flexShrink: 1 },
  track: {
    height: BAR,
    borderRadius: BAR / 2,
    overflow: 'hidden',
    backgroundColor: theme.colors.hero.track,
  },
  fill: { height: BAR, borderRadius: BAR / 2, backgroundColor: theme.colors.hero.fg },
  segments: { flexDirection: 'row', gap: 3 },
  segment: { flex: 1, height: BAR, borderRadius: BAR / 2 },
  done: { backgroundColor: theme.colors.hero.fg },
  now: { backgroundColor: theme.colors.hero.now },
  ahead: { backgroundColor: theme.colors.hero.ahead },
}));
