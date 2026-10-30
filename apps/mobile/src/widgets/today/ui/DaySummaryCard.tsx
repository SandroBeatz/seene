/**
 * The dark day summary (design "Таб · Сегодня"): earned against the plan with a
 * progress bar, and the visit count with one segment per visit (passed / now /
 * ahead). The whole card opens analytics. Ink in light theme, inverted in dark.
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { isSupportedLocale, pluralCategory } from '@/shared/lib/i18n';
import { Text } from '@/shared/ui';
import type { DaySummary } from '../model/summary';

export interface DaySummaryCardProps {
  summary: DaySummary;
  /** Formats a number without the currency ("3 600"). */
  formatNumber: (amount: number) => string;
  currency: string;
}

export function DaySummaryCard({ summary, formatNumber, currency }: DaySummaryCardProps) {
  const { t, i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const visitsWord = t(`today.visits_${pluralCategory(summary.count, locale)}`);
  const passed = summary.segments.filter((s) => s === 'done').length;
  const current = summary.segments.filter((s) => s === 'now').length;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={t('today.summaryHint')}
      onPress={() => router.push('/analytics')}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View
        style={styles.half}
        accessible
        accessibilityLabel={t('today.earnedA11y', {
          earned: formatNumber(summary.earned),
          planned: formatNumber(summary.planned),
          currency,
        })}>
        <View style={styles.line}>
          <Text variant="stat" color="onAccent" tabularNums>
            {formatNumber(summary.earned)}{' '}
            <Text variant="captionStrong" color="onAccent">
              {currency}
            </Text>
          </Text>
          <Text variant="caption" color="onAccent" tabularNums style={styles.muted}>
            {t('today.ofPlanned', { amount: formatNumber(summary.planned) })}
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${summary.progress * 100}%` }]} />
        </View>
      </View>

      <View
        style={[styles.half, styles.right]}
        accessible
        accessibilityLabel={t('today.segmentsA11y', {
          count: summary.count,
          visits: visitsWord,
          passed,
          current,
          ahead: summary.count - passed - current,
        })}>
        <Text variant="stat" color="onAccent" tabularNums>
          {summary.count}{' '}
          <Text variant="captionStrong" color="onAccent">
            {visitsWord}
          </Text>
        </Text>
        <View style={styles.segments}>
          {summary.segments.length === 0 ? (
            <View style={[styles.segment, styles.segmentAhead]} />
          ) : (
            summary.segments.map((segment, index) => (
              <View
                // Segments are positional: one per visit in start order.
                key={index}
                style={[
                  styles.segment,
                  segment === 'done' && styles.segmentDone,
                  segment === 'now' && styles.segmentNow,
                  segment === 'ahead' && styles.segmentAhead,
                ]}
              />
            ))
          )}
        </View>
      </View>
    </Pressable>
  );
}

const BAR = 5;

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row',
    gap: theme.space[3.5],
    paddingVertical: theme.space[3.5],
    paddingHorizontal: theme.space[4],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.accent.default,
  },
  pressed: { backgroundColor: theme.colors.accent.pressed },
  half: { flex: 1, gap: theme.space[2], justifyContent: 'space-between' },
  right: {
    flex: 0.77,
    paddingLeft: theme.space[3.5],
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: theme.colors.interaction.onSolidPressed,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.space[1.5],
  },
  muted: { opacity: 0.6 },
  track: {
    height: BAR,
    borderRadius: BAR / 2,
    overflow: 'hidden',
    backgroundColor: theme.colors.interaction.onSolidPressed,
  },
  fill: { height: BAR, borderRadius: BAR / 2, backgroundColor: theme.colors.accent.onAccent },
  segments: { flexDirection: 'row', gap: 3 },
  segment: { flex: 1, height: BAR, borderRadius: BAR / 2 },
  segmentDone: { backgroundColor: theme.colors.accent.onAccent },
  segmentNow: { backgroundColor: theme.colors.tone.summaryNow },
  segmentAhead: { backgroundColor: theme.colors.interaction.onSolidPressed },
}));
