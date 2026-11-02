/**
 * "Свой период" (design "Аналитика · тап по датам"): the two ends, quick ranges, one
 * month, "Показать · 14 дней". A tap sets the highlighted end and moves to the other.
 */
import { useState } from 'react';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { customPeriod, periodDays } from '@/entities/analytics';
import { useMoneyContext } from '@/entities/master';
import { pluralCategory } from '@/shared/lib/i18n';
import { Button, MonthGrid, SheetChrome, Text } from '@/shared/ui';
import { usePeriod } from '../model/usePeriod';

type Edge = 'start' | 'end';

export function RangeSheet() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { period, todayKey, setPeriod, userId } = usePeriod();
  const { locale } = useMoneyContext(userId);

  const clampEnd = (key: string) => (key > todayKey ? todayKey : key);
  const [start, setStart] = useState(period.startKey);
  const [end, setEnd] = useState(clampEnd(period.endKey));
  const [edge, setEdge] = useState<Edge>('end');
  // The grid keeps its own month; a quick range remounts it on the range's month.
  const [gridKey, setGridKey] = useState(0);

  const genitive = t('monthsGenitive', { returnObjects: true }) as string[];
  const label = (key: string) => {
    const date = DateTime.fromISO(key, { zone: 'utc' });
    return `${date.day} ${genitive[date.month - 1]}`;
  };

  const pick = (key: string) => {
    if (edge === 'start') {
      setStart(key);
      if (key > end) setEnd(key);
      setEdge('end');
    } else if (key < start) {
      setStart(key);
    } else {
      setEnd(key);
      setEdge('start');
    }
  };

  const quick = (from: string, to: string) => {
    setStart(from);
    setEnd(clampEnd(to));
    setEdge('start');
    setGridKey((k) => k + 1);
  };

  const today = DateTime.fromISO(todayKey, { zone: 'utc' });
  const month = DateTime.fromISO(end, { zone: 'utc' }).startOf('month');
  const monthNames = t('money.monthsAccusative', { returnObjects: true }) as string[];
  const quicks = [
    {
      key: 'last7',
      label: t('money.range.last7'),
      onPress: () => quick(today.minus({ days: 6 }).toISODate()!, todayKey),
    },
    {
      key: 'last30',
      label: t('money.range.last30'),
      onPress: () => quick(today.minus({ days: 29 }).toISODate()!, todayKey),
    },
    {
      key: 'half',
      label: t('money.range.firstHalf'),
      onPress: () => quick(month.toISODate()!, month.plus({ days: 14 }).toISODate()!),
    },
    {
      key: 'month',
      label: t('money.range.wholeMonth', { month: monthNames[month.month - 1] }),
      onPress: () => quick(month.toISODate()!, month.endOf('month').toISODate()!),
    },
  ];

  const days = periodDays({ startKey: start, endKey: end });

  return (
    <View style={styles.root} collapsable={false}>
      <SheetChrome title={t('money.range.title')} leadingLabel={t('common.close')} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: 96 + insets.bottom }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.ends}>
          {(['start', 'end'] as const).map((which) => (
            <Pressable
              key={which}
              accessibilityRole="button"
              accessibilityState={{ selected: edge === which }}
              onPress={() => setEdge(which)}
              style={[styles.end, edge === which && styles.endOn]}>
              <Text variant="caption2" color="secondary">
                {t(`money.range.${which}`)}
              </Text>
              <Text variant="bodyStrong" tabularNums>
                {label(which === 'start' ? start : end)}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickScroll}
          contentContainerStyle={styles.quicks}>
          {quicks.map((item) => (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              onPress={item.onPress}
              style={styles.quick}>
              <Text variant="footnoteStrong">{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.grid}>
          <MonthGrid
            key={gridKey}
            start={start}
            end={end}
            maxKey={todayKey}
            onPick={pick}
            monthNames={t('months', { returnObjects: true }) as string[]}
            weekdayNames={t('weekdays.short', { returnObjects: true }) as string[]}
            prevLabel={t('money.prevMonth')}
            nextLabel={t('money.nextMonth')}
          />
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          label={t('money.range.apply', {
            days: t(`money.days_${pluralCategory(days, locale)}`, { count: days }),
          })}
          onPress={() => {
            setPeriod(customPeriod(start, end));
            router.back();
          }}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  content: { paddingTop: theme.space[2], paddingHorizontal: theme.space[5] },
  ends: { flexDirection: 'row', gap: theme.space[2] },
  end: {
    flex: 1,
    height: 56,
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: theme.colors.bg.surface,
  },
  endOn: { borderColor: theme.colors.accent.default },
  quickScroll: { marginTop: theme.space[3], marginHorizontal: -theme.space[5] },
  quicks: { paddingHorizontal: theme.space[5], gap: theme.space[1.5] },
  quick: {
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: theme.space[3],
    borderRadius: 16,
    backgroundColor: theme.colors.bg.surface,
  },
  grid: { marginTop: theme.space[3.5] },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: theme.space[3],
    paddingHorizontal: theme.space[5],
    backgroundColor: theme.colors.bg.elevated,
  },
}));
