/**
 * The "Календарь" tab, month view (design "Таб · Календарь"): months one after another,
 * each a `Calendar` grid with bars for the day's records. The list's rows have their
 * real height (4–6 weeks), which `CalendarList` can't do. A tap opens the day.
 */
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useTranslation } from 'react-i18next';
import { FlatList, View, type ViewToken } from 'react-native';
import { Calendar, type CalendarProps, type DateData } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import { eventSwatch } from '@/shared/lib/color';
import { isSupportedLocale } from '@/shared/lib/i18n';
import { ErrorState, Text, useRefreshControl } from '@/shared/ui';
import {
  cellBars,
  daysOfMonth,
  monthKeyOf,
  monthRange,
  monthRows,
  withNeighbours,
  workMinutes,
} from '../model/calendar';
import { useCalendarSelection } from '../model/calendar.store';
import {
  useCalendarClock,
  useCalendarEntries,
  workdayOf,
  type CalendarClock,
  type CalendarEntry,
  type CalendarIndex,
} from '../model/useCalendarData';
import { dayTitle, daySummary, monthName, weekdayNames, type SummaryFormat } from './labels';
import { CELL_HEIGHT, MonthDay, type MonthBar, type MonthMarking } from './MonthDay';

const MONTHS_PAST = 12;
const MONTHS_FUTURE = 24;
const LABEL_HEIGHT = 48;
const VIEWABILITY = { viewAreaCoveragePercentThreshold: 25 };

const sectionHeight = (month: string) => LABEL_HEIGHT + monthRows(month) * CELL_HEIGHT;

const NoHeader = () => null;

export function CalendarMonthScreen() {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const clock = useCalendarClock();
  const selected = useCalendarSelection((s) => s.dayKey);

  const currentMonth = monthKeyOf(clock.todayKey);
  const months = useMemo(
    () => monthRange(currentMonth, MONTHS_PAST, MONTHS_FUTURE),
    [currentMonth],
  );
  const offsets = useMemo(
    () =>
      months.reduce<number[]>((at, month, i) => {
        at.push(i === 0 ? 0 : at[i - 1] + sectionHeight(months[i - 1]));
        return at;
      }, []),
    [months],
  );

  const [visible, setVisible] = useState<string[]>([currentMonth]);
  const { index, error, refetch } = useCalendarEntries(
    clock.userId,
    clock.zone,
    withNeighbours(visible),
  );
  const refreshControl = useRefreshControl(refetch);

  const list = useRef<FlatList<string>>(null);
  const shownRef = useRef(visible);
  const onViewable = useCallback(({ viewableItems }: { viewableItems: ViewToken<string>[] }) => {
    const shown = viewableItems.map((v) => v.item);
    if (shown.length) {
      shownRef.current = shown;
      setVisible(shown);
    }
  }, []);

  const scrollTo = useCallback(
    (month: string, animated: boolean) => {
      const at = months.indexOf(month);
      if (at >= 0) list.current?.scrollToIndex({ index: at, animated });
    },
    [months],
  );

  // Back from the day view: stay on the month that day ended up in, once per day opened.
  const returnedTo = useRef(selected);
  useFocusEffect(
    useCallback(() => {
      if (!selected || selected === returnedTo.current) return;
      returnedTo.current = selected;
      if (!shownRef.current.includes(monthKeyOf(selected))) {
        scrollTo(monthKeyOf(selected), false);
      }
    }, [selected, scrollTo]),
  );

  const openDay = useCallback(
    (date: DateData) =>
      router.push({ pathname: '/calendar-day', params: { date: date.dateString } }),
    [],
  );

  const calendarTheme = useMemo(
    () =>
      ({
        calendarBackground: 'transparent',
        'stylesheet.calendar.main': {
          container: { paddingLeft: 0, paddingRight: 0 },
          week: { marginVertical: 0, flexDirection: 'row' },
          dayContainer: { flex: 1 },
          emptyDayContainer: { flex: 1 },
        },
      }) as NonNullable<CalendarProps['theme']>,
    [],
  );

  const format: SummaryFormat = useMemo(
    () => ({ t, locale, currency: clock.currency }),
    [t, locale, clock.currency],
  );

  const shownMonth = visible[0] ?? currentMonth;

  return (
    <View style={styles.root}>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.View hidesSharedBackground>
          <View style={styles.heading}>
            <Text variant="title2" accessibilityRole="header" numberOfLines={1}>
              {monthName(t, shownMonth)}
            </Text>
            <Text variant="calloutMedium" color="tertiary" tabularNums>
              {shownMonth.slice(0, 4)}
            </Text>
          </View>
        </Stack.Toolbar.View>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button onPress={() => scrollTo(currentMonth, true)}>
          {t('calendar.today')}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <View style={process.env.EXPO_OS === 'ios' ? { paddingTop: headerHeight } : undefined}>
        <View style={styles.weekdays}>
          {weekdayNames(t).map((name) => (
            <Text
              key={name}
              variant="caption2Medium"
              color="tertiary"
              align="center"
              style={styles.weekday}>
              {name}
            </Text>
          ))}
        </View>
      </View>

      {error && index.size === 0 ? (
        <ErrorState
          message={t(errorMessageKey(normalizeError(error)))}
          onRetry={() => void refetch()}
        />
      ) : (
        <FlatList
          // Library styles are built once per mount.
          key={theme.name}
          ref={list}
          data={months}
          keyExtractor={(month) => month}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + theme.space[8] },
          ]}
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          initialScrollIndex={MONTHS_PAST}
          initialNumToRender={2}
          windowSize={5}
          maxToRenderPerBatch={1}
          getItemLayout={(_, i) => ({
            length: sectionHeight(months[i]),
            offset: offsets[i],
            index: i,
          })}
          viewabilityConfig={VIEWABILITY}
          onViewableItemsChanged={onViewable}
          renderItem={({ item }) => (
            <MonthSection
              month={item}
              isCurrent={item === currentMonth}
              index={index}
              todayKey={clock.todayKey}
              schedule={clock.schedule}
              selected={selected}
              format={format}
              calendarTheme={calendarTheme}
              onDay={openDay}
            />
          )}
        />
      )}
    </View>
  );
}

interface MonthSectionProps {
  month: string;
  isCurrent: boolean;
  index: CalendarIndex;
  todayKey: string;
  schedule: CalendarClock['schedule'];
  selected: string | null;
  format: SummaryFormat;
  calendarTheme: NonNullable<CalendarProps['theme']>;
  onDay: (date: DateData) => void;
}

const MonthSection = memo(function MonthSection({
  month,
  isCurrent,
  index,
  todayKey,
  schedule,
  selected,
  format,
  calendarTheme,
  onDay,
}: MonthSectionProps) {
  const { t } = format;
  const { theme } = useUnistyles();

  const fresh = useMemo(() => {
    const barOf = (entry: CalendarEntry): MonthBar => {
      if (entry.visit) {
        const swatch = eventSwatch(entry.visit.color, theme.name);
        return {
          id: entry.id,
          label: entry.visit.client?.first_name ?? t('today.schedule.unknownClient'),
          fill: swatch.fill,
          bar: swatch.bar,
          dashed: entry.visit.appointment.status === 'pending',
        };
      }
      return {
        id: entry.id,
        label: entry.block?.notes?.trim() || t('today.schedule.personal'),
        fill: theme.colors.bg.sunken,
        bar: theme.colors.content.tertiary,
        dashed: false,
      };
    };
    const marks: Record<string, MonthMarking> = {};
    for (const day of daysOfMonth(month)) {
      const entries = index.get(day);
      const working = workMinutes(workdayOf(schedule, day)) !== null;
      const { shown, more } = cellBars((entries ?? []).filter((e) => !e.continued));
      marks[day] = {
        bars: shown.map(barOf),
        more,
        today: day === todayKey,
        selected: day === selected,
        past: day < todayKey,
        // Without a stored schedule no day counts as off.
        off: schedule !== null && !working,
        a11y: `${dayTitle(t, day)}, ${daySummary(entries, working || schedule === null, format)}`,
      };
    }
    return marks;
  }, [month, index, todayKey, schedule, selected, theme, t, format]);
  // Scrolling loads neighbours and rebuilds the index. The grid is slow to repaint, and a month
  // whose own days look the same has no reason to.
  const markedKey = JSON.stringify(fresh);
  const marked = useMemo(() => JSON.parse(markedKey) as CalendarProps['markedDates'], [markedKey]);

  return (
    <View>
      <Text
        variant="headline"
        accessibilityRole="header"
        style={[styles.monthLabel, isCurrent && styles.monthLabelNow]}>
        {monthName(t, month)}
      </Text>
      <Calendar
        current={`${month}-01`}
        firstDay={1}
        hideExtraDays
        disableMonthChange
        customHeader={NoHeader}
        dayComponent={MonthDay as NonNullable<CalendarProps['dayComponent']>}
        markedDates={marked}
        onDayPress={onDay}
        theme={calendarTheme}
      />
    </View>
  );
});

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.canvas },
  heading: { flexDirection: 'row', alignItems: 'baseline', gap: theme.space[2] },
  weekdays: {
    flexDirection: 'row',
    paddingHorizontal: theme.space[2],
    paddingTop: theme.space[1],
    paddingBottom: theme.space[1.5],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  weekday: { flex: 1 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: theme.space[2] },
  monthLabel: {
    height: LABEL_HEIGHT,
    paddingTop: 18,
    paddingHorizontal: 6,
  },
  monthLabelNow: { color: theme.colors.brand.default },
}));
