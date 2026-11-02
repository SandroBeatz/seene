/**
 * A day of the month grid (design "Таб · Календарь"): its number and up to three bars
 * tinted with the service colour; unconfirmed ones are dashed, past days faded.
 */
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import type { DateData } from 'react-native-calendars';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/ui';

export const CELL_HEIGHT = 88;

export interface MonthBar {
  id: string;
  label: string;
  fill: string;
  bar: string;
  dashed: boolean;
}

export interface MonthMarking {
  bars: MonthBar[];
  more: number;
  today: boolean;
  selected: boolean;
  past: boolean;
  off: boolean;
  a11y: string;
}

interface MonthDayProps {
  date?: DateData;
  marking?: MonthMarking;
  onPress?: (date: DateData) => void;
}

export const MonthDay = memo(function MonthDay({ date, marking, onPress }: MonthDayProps) {
  if (!date) return null;
  const today = marking?.today ?? false;
  const selected = marking?.selected ?? false;
  const faded = marking?.past || marking?.off;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={marking?.a11y}
      onPress={() => onPress?.(date)}
      style={({ pressed }) => [styles.cell, marking?.off && styles.off, pressed && styles.pressed]}>
      <View style={[styles.number, today && styles.today, selected && !today && styles.selected]}>
        <Text
          variant="footnote"
          color={today ? 'inverse' : faded ? 'tertiary' : 'primary'}
          tabularNums
          style={today ? styles.numberToday : undefined}>
          {date.day}
        </Text>
      </View>
      {marking?.bars.map((bar) => (
        <View
          key={bar.id}
          style={[
            styles.bar,
            bar.dashed
              ? [styles.dashed, { borderColor: bar.bar }]
              : { backgroundColor: bar.fill, borderLeftColor: bar.bar, borderLeftWidth: 2 },
            marking.past && styles.pastBar,
          ]}>
          <Text variant="micro" numberOfLines={1} style={styles.barText}>
            {bar.label}
          </Text>
        </View>
      ))}
      {marking?.more ? (
        <Text variant="micro" color="secondary" tabularNums style={styles.more}>
          +{marking.more}
        </Text>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create((theme) => ({
  cell: {
    height: CELL_HEIGHT,
    width: '100%',
    paddingTop: 4,
    paddingHorizontal: 2,
    gap: 2,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
    overflow: 'hidden',
  },
  off: { backgroundColor: theme.colors.bg.surface },
  pressed: { opacity: 0.6 },
  number: {
    alignSelf: 'center',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  today: { backgroundColor: theme.colors.content.primary },
  selected: { backgroundColor: theme.colors.bg.sunken },
  numberToday: { fontFamily: theme.typography.footnoteStrong.fontFamily },
  bar: {
    height: 14,
    borderRadius: 4,
    paddingHorizontal: 4,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dashed: { borderWidth: 1, borderStyle: 'dashed', backgroundColor: theme.colors.bg.canvas },
  pastBar: { opacity: 0.5 },
  barText: { fontSize: 9.5, lineHeight: 12 },
  more: { fontSize: 9.5, lineHeight: 13, paddingLeft: 4 },
}));
