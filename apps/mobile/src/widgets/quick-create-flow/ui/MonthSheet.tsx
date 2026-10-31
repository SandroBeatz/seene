/**
 * "Выберите день" (design "AppNewTimeMonth"): the months ahead as calendars, Monday
 * first, each day with the same dot as the strip; days off and days gone by in grey.
 * A tap picks the day and returns to the time step. A native sheet over the flow.
 */
import { useMemo } from 'react';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { SheetChrome, Skeleton, Text, useNow } from '@/shared/ui';
import { useDayGrid } from '../model/useDayGrid';
import { useFlowData } from '../model/useFlowData';
import { DAYS_AHEAD } from './TimeStep';

export function MonthSheet() {
  const flow = useFlowData();
  const { t, zone, draft } = flow;
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const now = useNow();

  const today = DateTime.fromMillis(now, { zone }).startOf('day');
  const todayKey = today.toISODate()!;
  const firstKey = today.startOf('month').toISODate()!;
  const lastKey = today.plus({ days: DAYS_AHEAD - 1 }).toISODate()!;

  const grid = useDayGrid({
    userId: flow.userId,
    zone,
    schedule: flow.schedule,
    stepMinutes: flow.stepMinutes,
    duration: flow.duration,
    now,
    fromKey: firstKey,
    toKey: lastKey,
  });

  const months = useMemo(() => {
    const out: DateTime[] = [];
    for (let m = today.startOf('month'); m.toISODate()! <= lastKey; m = m.plus({ months: 1 })) {
      out.push(m);
    }
    return out;
  }, [today, lastKey]);

  const monthNames = t('months', { returnObjects: true }) as string[];
  const weekdays = t('weekdays.short', { returnObjects: true }) as string[];
  const chosen = draft.dayKey ?? todayKey;

  const pick = (key: string) => {
    draft.setDay(key);
    router.back();
  };

  return (
    <View style={styles.root} collapsable={false}>
      <SheetChrome title={t('quickCreate.month.title')} leadingLabel={t('common.close')} spacer />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        {grid.isPending ? (
          <Skeleton height={280} radius={16} />
        ) : (
          months.map((month, index) => {
            const blanks = month.weekday - 1;
            const count = month.daysInMonth ?? 30;
            return (
              <View key={month.toISODate()} style={styles.month}>
                <View style={styles.monthHead}>
                  <Text variant="headline">{`${monthNames[month.month - 1]} ${month.year}`}</Text>
                  {index === 0 && months.length > 1 ? (
                    <Text variant="footnote" color="tertiary">
                      {t('quickCreate.month.scroll')}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.week}>
                  {weekdays.map((w) => (
                    <Text
                      key={w}
                      variant="footnote"
                      color="tertiary"
                      align="center"
                      style={styles.cell}>
                      {w}
                    </Text>
                  ))}
                </View>
                <View style={styles.days}>
                  {Array.from({ length: blanks }, (_, i) => (
                    <View key={`b${i}`} style={styles.cell} />
                  ))}
                  {Array.from({ length: count }, (_, i) => {
                    const key = month.set({ day: i + 1 }).toISODate()!;
                    const load = grid.loads.get(key);
                    const outside = key < todayKey || key > lastKey;
                    const grey = outside || load === 'off';
                    const on = key === chosen;
                    const dot = outside
                      ? 'transparent'
                      : load === 'open'
                        ? theme.colors.feedback.success
                        : load === 'tight' || load === 'full'
                          ? theme.colors.feedback.warning
                          : 'transparent';
                    return (
                      <View key={key} style={styles.cell}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ selected: on, disabled: key > lastKey }}
                          accessibilityLabel={`${i + 1} ${monthNames[month.month - 1]}`}
                          disabled={key > lastKey}
                          onPress={() => pick(key)}
                          style={[styles.dayButton, on && styles.dayOn]}>
                          <Text
                            variant="bodyLarge"
                            color={on ? 'onAccent' : grey ? 'disabled' : 'primary'}
                            tabularNums>
                            {i + 1}
                          </Text>
                          <View
                            style={[
                              styles.dot,
                              {
                                backgroundColor:
                                  on && dot !== 'transparent' ? theme.colors.accent.onAccent : dot,
                              },
                            ]}
                          />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: theme.colors.feedback.success }]} />
            <Text variant="footnote" color="tertiary">
              {t('quickCreate.time.legendOpen')}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: theme.colors.feedback.warning }]} />
            <Text variant="footnote" color="tertiary">
              {t('quickCreate.time.legendTight')}
            </Text>
          </View>
          <Text variant="footnote" color="tertiary">
            {t('quickCreate.month.legendOff')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  content: { paddingTop: theme.space[2], paddingHorizontal: theme.space[4], gap: theme.space[6] },
  month: { gap: theme.space[2] },
  monthHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  week: { flexDirection: 'row' },
  days: { flexDirection: 'row', flexWrap: 'wrap', rowGap: theme.space[1] },
  cell: { width: `${100 / 7}%`, alignItems: 'center' },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayOn: { backgroundColor: theme.colors.accent.default },
  dot: { width: 4, height: 4, borderRadius: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: theme.space[3] },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1] },
}));
