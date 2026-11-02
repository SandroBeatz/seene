/**
 * The calendar's day view (design "Календарь, день"), built on `react-native-calendars`:
 * `CalendarProvider` holds the date, `WeekCalendar` is the strip, `TimelineList` the
 * hours — swiped sideways from day to day. A tap on a record opens it, a long press
 * opens the same menu as on "Сегодня"; an empty cell lights up under the finger and
 * starts a new appointment at its time.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, Stack } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import {
  CalendarProvider,
  Timeline,
  TimelineList,
  WeekCalendar,
  type CalendarProps,
  type TimelineListProps,
  type TimelinePackedEventProps,
} from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { scheduleCardLook } from '@/entities/appointment';
import type { TimeBlock } from '@/entities/time-block';
import {
  BlockEventPreview,
  VisitEventPreview,
  scheduleMenuRows,
  useVisitActions,
  type BlockLook,
  type ScheduleMenuAction,
  type ScheduleVisit,
} from '@/features/appointment-actions';
import {
  timeBlockMenuRows,
  useTimeBlockActions,
  type TimeBlockAction,
} from '@/features/time-block-actions';
import { formatAmount, formatTime } from '@/shared/lib/formats';
import { isSupportedLocale } from '@/shared/lib/i18n';
import { ContextMenu, Text, type ContextMenuAnchor } from '@/shared/ui';
import {
  daysOfMonth,
  CELL_MINUTES,
  freeCells,
  monthKeyOf,
  parseHhmm,
  timelineStamp,
  unavailableHours,
  withNeighbours,
  workMinutes,
} from '../model/calendar';
import { useCalendarSelection } from '../model/calendar.store';
import {
  useCalendarClock,
  useCalendarEntries,
  workdayOf,
  type CalendarEntry,
} from '../model/useCalendarData';
import { dayTitle, daySummary, monthName, weekdayNames } from './labels';
import {
  TimelineEvent,
  type CalendarTimelineEvent,
  type TimelineEventHandlers,
} from './TimelineEvent';
import { WEEK_HEIGHT, WeekDay, WeekStripContext, type WeekStripState } from './WeekDay';

/** Width of the hours column. */
const TIME_INSET = 60;
/** Space kept clear at the screen's right edge. */
const RIGHT_EDGE = 16;

const openBlock = (block: TimeBlock) =>
  router.push({ pathname: '/time-block/[blockId]', params: { blockId: block.id } });
const newAppointment = (dayKey: string, start?: string) =>
  router.push({ pathname: '/quick-create', params: { dayKey, start } });

type Menu =
  | { kind: 'visit'; visit: ScheduleVisit; anchor: ContextMenuAnchor; range: string }
  | { kind: 'block'; block: TimeBlock; anchor: ContextMenuAnchor; look: BlockLook };

export function CalendarDayScreen({ initialDate }: { initialDate?: string }) {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const clock = useCalendarClock();
  const { now, nowMinutes, todayKey, zone, schedule, timeFormat, currency } = clock;

  const [date, setDate] = useState(initialDate ?? todayKey);
  const setSelection = useCalendarSelection((s) => s.setDayKey);
  useEffect(() => setSelection(date), [date, setSelection]);

  const months = withNeighbours([monthKeyOf(date)]);
  const { index } = useCalendarEntries(clock.userId, zone, months);
  const monthsKey = months.join();

  const clockTime = useCallback(
    (minutes: number) =>
      formatTime(DateTime.utc(2000, 1, 1).plus({ minutes }).toISO()!, {
        zone: 'utc',
        timeFormat,
      }),
    [timeFormat],
  );
  const rangeOf = useCallback(
    (from: number, to: number) => `${clockTime(from)}–${clockTime(to)}`,
    [clockTime],
  );
  const blockLook = useCallback(
    (entry: CalendarEntry): BlockLook => ({
      range: entry.allDay ? t('today.schedule.allDay') : rangeOf(entry.from, entry.to),
      name: entry.block?.notes?.trim() || t('today.schedule.personal'),
    }),
    [rangeOf, t],
  );

  // Rebuilt every minute (`now`): that also repaints the timeline's "now" line.
  const events = useMemo(() => {
    const byDay: Record<string, CalendarTimelineEvent[]> = {};
    for (const day of monthsKey.split(',').flatMap(daysOfMonth)) {
      const entries = index.get(day) ?? [];
      const timed = entries.filter((e) => !e.allDay);
      const past = day < todayKey;
      const today = day === todayKey;
      const list: CalendarTimelineEvent[] = timed.map((entry) => {
        const base = {
          id: entry.id,
          start: timelineStamp(day, entry.from),
          end: timelineStamp(day, entry.to),
        };
        if (entry.visit) {
          const { appointment } = entry.visit;
          return {
            ...base,
            title: '',
            color: 'transparent',
            meta: {
              kind: 'visit' as const,
              visit: entry.visit,
              range: rangeOf(entry.from, entry.to),
              dimmed: scheduleCardLook(appointment, now).dimmed,
              ongoing: scheduleCardLook(appointment, now).ongoing,
            },
          };
        }
        return {
          ...base,
          title: '',
          color: 'transparent',
          meta: {
            kind: 'block' as const,
            block: entry.block!,
            look: {
              ...blockLook(entry),
              ongoing: today && entry.from <= nowMinutes && nowMinutes < entry.to,
            },
            dimmed: past || (today && entry.to <= nowMinutes),
          },
        };
      });
      const workday = workdayOf(schedule, day);
      const work = workMinutes(workday);
      const dayIsFull = entries.some((e) => e.allDay);
      if (work && !past && !dayIsFull) {
        const busy = [
          ...timed.map((e) => [e.from, e.to] as const),
          ...(workday?.breaks ?? []).map((b) => {
            return [parseHhmm(b.start), parseHhmm(b.end)] as const;
          }),
        ];
        for (const from of freeCells({ work, busy, after: today ? nowMinutes : 0 })) {
          list.push({
            id: `free-${day}-${from}`,
            start: timelineStamp(day, from),
            end: timelineStamp(day, from + CELL_MINUTES),
            title: '',
            color: 'transparent',
            meta: { kind: 'free', dayKey: day, minutes: from },
          });
        }
      }
      byDay[day] = list;
    }
    return byDay;
  }, [monthsKey, index, todayKey, now, nowMinutes, schedule, rangeOf, blockLook]);

  const strip = useMemo<WeekStripState>(() => {
    const working = (day: string) => workMinutes(workdayOf(schedule, day)) !== null;
    return {
      selected: date,
      todayKey,
      isOff: (day) => schedule !== null && !working(day),
      hasVisits: (day) => (index.get(day) ?? []).some((e) => e.visit),
      a11y: (day) =>
        `${dayTitle(t, day)}, ${daySummary(index.get(day), working(day) || schedule === null, {
          t,
          locale,
          currency,
        })}`,
    };
  }, [date, todayKey, schedule, index, t, locale, currency]);

  const actions = useVisitActions({ zone, todayKey, timeFormat, currency, locale });
  const blockActions = useTimeBlockActions();
  const [menu, setMenu] = useState<Menu | null>(null);

  const handlers = useMemo<TimelineEventHandlers>(
    () => ({
      onVisit: (visit) =>
        router.push({
          pathname: '/appointment/[appointmentId]',
          params: { appointmentId: visit.appointment.id },
        }),
      onVisitMenu: (visit, anchor, range) => setMenu({ kind: 'visit', visit, anchor, range }),
      onBlock: openBlock,
      onBlockMenu: (block, anchor, look) => setMenu({ kind: 'block', block, anchor, look }),
      onFree: (dayKey, minutes) =>
        newAppointment(
          dayKey,
          DateTime.fromISO(dayKey, { zone })
            .set({ hour: Math.floor(minutes / 60), minute: minutes % 60 })
            .toUTC()
            .toISO()!,
        ),
      clockTime,
    }),
    [zone, clockTime],
  );

  const timelineProps = useMemo<TimelineListProps['timelineProps']>(
    () => ({
      format24h: timeFormat === 24,
      overlapEventsSpacing: 3,
      rightEdgeSpacing: RIGHT_EDGE,
      theme: {
        calendarBackground: theme.colors.bg.canvas,
        line: { backgroundColor: theme.colors.border.subtle },
        verticalLine: { width: 0 },
        timeLabel: {
          color: theme.colors.content.tertiary,
          fontFamily: theme.typography.caption2.fontFamily,
          fontSize: 11,
          paddingLeft: 0,
        },
        nowIndicatorLine: { backgroundColor: theme.colors.brand.default, height: 2 },
        nowIndicatorKnob: { backgroundColor: theme.colors.brand.default },
        event: { paddingLeft: 0, paddingTop: 0, borderWidth: 0, opacity: 1 },
      } as unknown as CalendarProps['theme'],
      unavailableHoursColor: theme.colors.bg.surface,
      renderEvent: (event: TimelinePackedEventProps) => (
        <TimelineEvent
          meta={(event as unknown as CalendarTimelineEvent).meta}
          width={event.width}
          height={event.height}
          handlers={handlers}
        />
      ),
    }),
    [timeFormat, theme, handlers],
  );

  const renderItem = useCallback<NonNullable<TimelineListProps['renderItem']>>(
    (props, info) => {
      const { key: _key, ...timeline } = props as typeof props & { key?: string };
      const workday = workdayOf(schedule, info.item);
      const off = schedule !== null && !workMinutes(workday);
      if (off && !(events[info.item]?.length ?? 0)) {
        return (
          <View style={styles.offDay}>
            <Text variant="footnote" color="secondary">
              {t('calendar.dayOff')}
            </Text>
            {info.item >= todayKey ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => newAppointment(info.item)}
                hitSlop={8}>
                <Text variant="footnoteStrong">{t('calendar.addVisit')}</Text>
              </Pressable>
            ) : null}
          </View>
        );
      }
      return (
        <Timeline
          {...timeline}
          unavailableHours={schedule ? unavailableHours(workday) : undefined}
        />
      );
    },
    [events, schedule, t, todayKey],
  );

  // `Timeline` draws "now" from the device clock: only true when it matches the master's.
  const clocksAgree = DateTime.fromMillis(now).offset === DateTime.fromMillis(now, { zone }).offset;

  const dayEntries = index.get(date);
  const working = workMinutes(workdayOf(schedule, date)) !== null;
  const allDay = (dayEntries ?? []).filter((e) => e.allDay && e.block);
  const money = { currency, locale };

  return (
    <View
      style={[styles.root, process.env.EXPO_OS === 'ios' ? { paddingTop: headerHeight } : null]}>
      <Stack.Screen options={{ headerBackTitle: monthName(t, monthKeyOf(date)) }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button onPress={() => setDate(todayKey)}>
          {t('calendar.today')}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <WeekStripContext.Provider value={strip}>
        <CalendarProvider
          // Library styles are built once per mount.
          key={theme.name}
          date={date}
          onDateChanged={setDate}
          timelineLeftInset={TIME_INSET}
          theme={{ calendarBackground: theme.colors.bg.canvas }}>
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
          <WeekCalendar
            firstDay={1}
            hideDayNames
            allowShadow={false}
            calendarHeight={WEEK_HEIGHT}
            dayComponent={WeekDay as NonNullable<CalendarProps['dayComponent']>}
            style={styles.week}
            theme={{ calendarBackground: theme.colors.bg.canvas }}
          />

          <View style={styles.title}>
            <Text variant="bodyStrong" numberOfLines={1} style={styles.titleText}>
              {dayTitle(t, date)}
            </Text>
            <Text variant="caption" color="secondary" tabularNums>
              {daySummary(dayEntries, working || schedule === null, {
                t,
                locale,
                currency,
              })}
            </Text>
          </View>
          {allDay.map((entry) => (
            <Pressable
              key={entry.id}
              accessibilityRole="button"
              onPress={() => openBlock(entry.block!)}
              style={styles.allDay}>
              <Text variant="caption" color="secondary" numberOfLines={1}>
                {`${t('today.schedule.allDay')} · ${blockLook(entry).name}`}
              </Text>
            </Pressable>
          ))}

          {/* A native tab's safe area includes its bar: the hours stop above it. */}
          <View style={[styles.timeline, { paddingBottom: insets.bottom }]}>
            <TimelineList
              events={events}
              timelineProps={timelineProps}
              renderItem={renderItem}
              showNowIndicator={clocksAgree}
              scrollToNow={clocksAgree}
              scrollToFirst
              initialTime={{ hour: 8, minutes: 0 }}
            />
          </View>
        </CalendarProvider>
      </WeekStripContext.Provider>

      <ContextMenu
        anchor={menu?.anchor ?? null}
        preview={
          menu?.kind === 'block' ? (
            <BlockEventPreview look={menu.look} />
          ) : menu ? (
            <VisitEventPreview
              visit={menu.visit}
              range={menu.range}
              now={now}
              formatAmount={(n) => formatAmount(n, money)}
            />
          ) : null
        }
        note={
          menu?.kind === 'visit' && menu.visit.appointment.notes?.trim()
            ? { label: t('today.attention.noteLabel'), text: menu.visit.appointment.notes.trim() }
            : null
        }
        items={
          !menu
            ? []
            : menu.kind === 'block'
              ? timeBlockMenuRows(t)
              : scheduleMenuRows(menu.visit.appointment, now, t)
        }
        closeLabel={t('common.close')}
        onClose={() => setMenu(null)}
        onSelect={(key) => {
          if (menu?.kind === 'block') {
            blockActions.run(menu.block, key as TimeBlockAction);
          } else if (menu) {
            actions.run(menu.visit, key as ScheduleMenuAction);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.canvas },
  weekdays: {
    flexDirection: 'row',
    paddingTop: theme.space[1],
    paddingHorizontal: theme.space[2],
  },
  weekday: { flex: 1 },
  week: { paddingLeft: theme.space[2], paddingRight: theme.space[2], marginTop: 0 },
  title: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.space[2.5],
    paddingHorizontal: theme.space[5],
    paddingTop: theme.space[2],
    paddingBottom: theme.space[2.5],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  titleText: { flex: 1 },
  allDay: {
    paddingHorizontal: theme.space[5],
    paddingVertical: theme.space[1.5],
    backgroundColor: theme.colors.bg.surface,
  },
  timeline: { flex: 1 },
  offDay: {
    margin: theme.space[4],
    height: 56,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space[3.5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.bg.surface,
  },
}));
