/**
 * One month, Monday first, with its own arrows (design "Свой период"). Picks a day
 * or shows a range: the ends in ink, the days between on a band. Days are calendar
 * keys ("yyyy-MM-dd"), so this knows nothing about time zones.
 */
import { useState } from 'react';
import { DateTime } from 'luxon';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon } from '@/shared/ui/Icon';
import { Text } from '@/shared/ui/Text';

export interface MonthGridProps {
  /** Selected range; for a single day both ends are the same key, empty for none yet. */
  start: string;
  end: string;
  /** The last day that can be picked ("yyyy-MM-dd"). */
  maxKey?: string;
  /** The first day that can be picked ("yyyy-MM-dd"). */
  minKey?: string;
  onPick: (dayKey: string) => void;
  /** "Октябрь", January first. */
  monthNames: readonly string[];
  /** "Пн", Monday first. */
  weekdayNames: readonly string[];
  prevLabel: string;
  nextLabel: string;
}

export function MonthGrid({
  start,
  end,
  maxKey,
  minKey,
  onPick,
  monthNames,
  weekdayNames,
  prevLabel,
  nextLabel,
}: MonthGridProps) {
  const [cursor, setCursor] = useState(() =>
    (end ? DateTime.fromISO(end, { zone: 'utc' }) : DateTime.utc()).startOf('month'),
  );
  const lead = cursor.weekday - 1;
  const cells = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: cursor.daysInMonth ?? 30 }, (_, i) => cursor.plus({ days: i })),
  ];
  // Whole weeks as rows: seven 14.28% cells on one wrapped line can round past the width.
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  const canGoNext = !maxKey || cursor.plus({ months: 1 }).toISODate()! <= maxKey;

  return (
    <View>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={prevLabel}
          onPress={() => setCursor((m) => m.minus({ months: 1 }))}
          style={styles.arrow}>
          <Icon name="chevronLeft" size="base" color="content.primary" />
        </Pressable>
        <Text variant="bodyStrong">{`${monthNames[cursor.month - 1]} ${cursor.year}`}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={nextLabel}
          accessibilityState={{ disabled: !canGoNext }}
          disabled={!canGoNext}
          onPress={() => setCursor((m) => m.plus({ months: 1 }))}
          style={styles.arrow}>
          <Icon
            name="chevronRight"
            size="base"
            color={canGoNext ? 'content.primary' : 'content.disabled'}
          />
        </Pressable>
      </View>
      <View style={styles.row}>
        {weekdayNames.map((name) => (
          <View key={name} style={styles.cell}>
            <Text variant="caption2" color="tertiary" align="center">
              {name}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.days}>
        {weeks.map((week, row) => (
          <View key={row} style={styles.week}>
            {week.map((day, column) => {
              if (!day) return <View key={`empty-${column}`} style={styles.dayCell} />;
              const key = day.toISODate()!;
              const isEnd = key === start || key === end;
              const between = key > start && key < end;
              const hasRange = start !== end;
              const disabled = (!!maxKey && key > maxKey) || (!!minKey && key < minKey);
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={key}
                  accessibilityState={{ disabled, selected: isEnd }}
                  disabled={disabled}
                  onPress={() => onPick(key)}
                  style={styles.dayCell}>
                  {between || (isEnd && hasRange) ? (
                    <View
                      style={[
                        styles.band,
                        key === start && styles.bandFromMiddle,
                        key === end && styles.bandToMiddle,
                        column === 0 && styles.bandRoundLeft,
                        column === 6 && styles.bandRoundRight,
                      ]}
                    />
                  ) : null}
                  <View style={[styles.number, isEnd && styles.numberEnd]}>
                    <Text
                      variant={isEnd ? 'bodyStrong' : 'bodyMedium'}
                      color={isEnd ? 'onAccent' : disabled || column === 6 ? 'tertiary' : 'primary'}
                      tabularNums>
                      {day.day}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  row: { marginTop: theme.space[1], flexDirection: 'row' },
  cell: { flex: 1 },
  days: { marginTop: theme.space[1], gap: 2 },
  week: { flexDirection: 'row' },
  dayCell: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' },
  band: {
    position: 'absolute',
    top: 1,
    bottom: 1,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.bg.sunken,
  },
  bandFromMiddle: { left: '50%' },
  bandToMiddle: { right: '50%' },
  bandRoundLeft: { borderTopLeftRadius: 19, borderBottomLeftRadius: 19 },
  bandRoundRight: { borderTopRightRadius: 19, borderBottomRightRadius: 19 },
  number: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberEnd: { backgroundColor: theme.colors.accent.default },
}));
