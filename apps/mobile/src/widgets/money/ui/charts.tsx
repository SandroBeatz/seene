/** The analytics marks: revenue bars, weekday bars, the stacked share bar, the ring. */
import { View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/ui';
import type { Bar } from '../model/overview';

const BARS_HEIGHT = 104;
/** More bars than this and they thin out. */
const WIDE_BARS = 12;

export function RevenueBars({ bars }: { bars: Bar[] }) {
  const { theme } = useUnistyles();
  const max = Math.max(1, ...bars.map((bar) => bar.amount));
  const thin = bars.length > WIDE_BARS;
  const fill = {
    current: theme.colors.content.primary,
    past: theme.colors.border.dashed,
    future: theme.colors.bg.sunken,
  };
  return (
    <View style={styles.revenue} accessibilityRole="image">
      {bars.map((bar) => (
        <View key={bar.key} style={styles.revenueColumn}>
          <View
            style={{
              width: '100%',
              maxWidth: thin ? 7 : 28,
              borderRadius: thin ? 3 : 6,
              height: bar.amount
                ? Math.max(4, Math.round((bar.amount / max) * BARS_HEIGHT))
                : 2,
              backgroundColor: fill[bar.state],
            }}
          />
          <View style={styles.revenueLabel}>
            {/* A day number is wider than its thin bar: let it overflow the column. */}
            <Text variant="caption2" color="tertiary" numberOfLines={1} style={styles.noWrap}>
              {bar.label}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const BUSY_HEIGHT = 84;

export function BusyBars({ counts, labels }: { counts: number[]; labels: readonly string[] }) {
  const { theme } = useUnistyles();
  const max = Math.max(...counts);
  return (
    <View style={styles.busy} accessibilityRole="image">
      {counts.map((count, index) => (
        <View key={labels[index]} style={styles.revenueColumn}>
          <View
            style={{
              width: '100%',
              maxWidth: 30,
              borderRadius: 8,
              height: max ? Math.max(4, Math.round((count / max) * BUSY_HEIGHT)) : 4,
              backgroundColor:
                max > 0 && count === max
                  ? theme.colors.content.primary
                  : theme.colors.border.default,
            }}
          />
          <Text variant="caption2" color="tertiary">
            {labels[index]}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Greys by rank, as in the design's "Расходы" and "Способы оплаты". */
export function useRankColors(): string[] {
  const { theme } = useUnistyles();
  const c = theme.colors;
  return [c.content.primary, c.content.secondary, c.content.tertiary, c.border.strong, c.border.dashed];
}

export function ShareBar({ parts }: { parts: { key: string; value: number; color: string }[] }) {
  return (
    <View style={styles.share}>
      {parts.map((part) => (
        <View key={part.key} style={{ flex: part.value, backgroundColor: part.color }} />
      ))}
    </View>
  );
}

const RING_RADIUS = 44;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

export function ClientRing({ percent, label }: { percent: number; label: string }) {
  const { theme } = useUnistyles();
  const c = theme.colors;
  return (
    <Svg width={112} height={112} viewBox="0 0 116 116" accessibilityLabel={`${percent}% ${label}`}>
      <Circle
        cx={58}
        cy={58}
        r={RING_RADIUS}
        fill="none"
        stroke={c.brand.default}
        strokeWidth={14}
      />
      <Circle
        cx={58}
        cy={58}
        r={RING_RADIUS}
        fill="none"
        stroke={c.content.primary}
        strokeWidth={14}
        strokeDasharray={`${(percent / 100) * RING_LENGTH} ${RING_LENGTH}`}
        rotation={-90}
        originX={58}
        originY={58}
      />
      <SvgText
        x={58}
        y={62}
        textAnchor="middle"
        fontFamily={theme.typography.stat.fontFamily}
        fontSize={24}
        fill={c.content.primary}>
        {`${percent}%`}
      </SvgText>
      <SvgText
        x={58}
        y={77}
        textAnchor="middle"
        fontFamily={theme.typography.caption.fontFamily}
        fontSize={10}
        fill={c.content.secondary}>
        {label}
      </SvgText>
    </Svg>
  );
}

const styles = StyleSheet.create((theme) => ({
  revenue: {
    marginTop: theme.space[4],
    height: 128,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  revenueColumn: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.space[1.5],
  },
  revenueLabel: { height: 14, width: 28, alignItems: 'center' },
  noWrap: { flexShrink: 0 },
  busy: {
    marginTop: theme.space[3],
    height: 104,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.space[2],
  },
  share: {
    marginTop: theme.space[3],
    height: 10,
    flexDirection: 'row',
    gap: 2,
    borderRadius: 5,
    overflow: 'hidden',
  },
}));
