/**
 * Moving an appointment: a strip of days and the day's free start times grouped into
 * morning / afternoon / evening — the time step of online booking (design "MpStep2"),
 * in the master's zone. Free = inside working hours, clear of other visits, breaks
 * and personal time. "Указать время вручную" places it anywhere (off-hours too).
 */
import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import {
  appointmentEndMs,
  isShownInSchedule,
  useAppointmentsRangeQuery,
  useUpdateAppointmentMutation,
  type Appointment,
} from '@/entities/appointment';
import { scheduleForWeekday, type StoredSchedule } from '@/entities/master';
import { useUserId } from '@/entities/session';
import { useTimeBlocksRangeQuery } from '@/entities/time-block';
import { formatTime } from '@/shared/lib/formats';
import type { AppLocale } from '@/shared/lib/i18n';
import { dayBounds, findFreeSlots, groupByDayPart, weekdayIndex } from '@/shared/lib/scheduling';
import { deviceTimeZone, toUtcIsoFromWallClock } from '@/shared/lib/time-zone';
import { Button, IconButton, Skeleton, Text, TimePicker, useNow } from '@/shared/ui';

/** How far ahead the strip goes. */
const DAYS_AHEAD = 60;

export interface RescheduleEditorProps {
  appointment: Appointment;
  zone: string;
  schedule: StoredSchedule | null;
  stepMinutes: number;
  timeFormat: 12 | 24;
  locale: AppLocale;
}

export function RescheduleEditor({
  appointment,
  zone,
  schedule,
  stepMinutes,
  timeFormat,
  locale,
}: RescheduleEditorProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const userId = useUserId() ?? '';
  const update = useUpdateAppointmentMutation(userId);
  const now = useNow();

  const todayKey = DateTime.fromMillis(now, { zone }).toISODate()!;
  const currentKey = DateTime.fromISO(appointment.start_at, { zone: 'utc' })
    .setZone(zone)
    .toISODate()!;
  const [dayKey, setDayKey] = useState(currentKey >= todayKey ? currentKey : todayKey);
  const [slot, setSlot] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  const days = useMemo(
    () =>
      Array.from({ length: DAYS_AHEAD }, (_, i) =>
        DateTime.fromISO(todayKey, { zone }).plus({ days: i }).toISODate()!,
      ),
    [todayKey, zone],
  );
  const weekdays = t('weekdays.short', { returnObjects: true }) as string[];
  const workdayOf = (key: string) =>
    schedule ? scheduleForWeekday(schedule, weekdayIndex(key)) : null;

  const bounds = dayBounds(dayKey, zone);
  const visits = useAppointmentsRangeQuery(userId, bounds.start, bounds.end);
  const blocks = useTimeBlocksRangeQuery(userId, bounds.start, bounds.end);

  const groups = useMemo(() => {
    if (!visits.data || !blocks.data) return null;
    const busy = [
      ...visits.data
        .filter((a) => a.id !== appointment.id && isShownInSchedule(a))
        .map((a) => ({ start: a.start_at, end: new Date(appointmentEndMs(a)).toISOString() })),
      ...blocks.data.map((b) => ({ start: b.start_at, end: b.end_at })),
    ];
    const free = findFreeSlots({
      dayKey,
      zone,
      workday: schedule ? scheduleForWeekday(schedule, weekdayIndex(dayKey)) : null,
      stepMinutes,
      duration: appointment.duration,
      busy,
      now,
    });
    return groupByDayPart(free, zone);
  }, [visits.data, blocks.data, dayKey, zone, schedule, stepMinutes, appointment, now]);

  const time = (iso: string) => formatTime(iso, { zone, timeFormat });
  const label = (iso: string) => {
    const local = DateTime.fromISO(iso, { zone: 'utc' }).setZone(zone).setLocale(locale);
    return `${weekdays[local.weekday - 1]}, ${local.toFormat('d MMMM')}, ${time(iso)}`;
  };

  const save = () => {
    if (!slot) return;
    update.mutate(
      { id: appointment.id, start_at: slot },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
      },
    );
  };

  const pickManual = (clock: string) => {
    setManualOpen(false);
    const [hour, minute] = clock.split(':').map(Number);
    const [year, month, day] = dayKey.split('-').map(Number);
    setSlot(toUtcIsoFromWallClock({ year, month, day, hour, minute }, zone));
  };

  // Hermes' Intl has no standalone month names (luxon prints "null"): they come from i18n.
  const month = (t('months', { returnObjects: true }) as string[])[
    DateTime.fromISO(dayKey, { zone }).month - 1
  ];
  // The zone is worth a word only when the phone is elsewhere.
  const showZone = zone !== deviceTimeZone();

  return (
    // Kept as a real view: a form sheet (react-native-screens) pins a ScrollView that
    // is a direct child of the screen to the top and stretches it over the header.
    <View style={styles.root} collapsable={false}>
      <View style={styles.grabber} />
      <View style={styles.header}>
        <IconButton
          icon="chevronLeft"
          accessibilityLabel={t('reschedule.back')}
          variant="ghost"
          onPress={() => router.back()}
        />
        <Text variant="calloutStrong" align="center" style={styles.title}>
          {t('reschedule.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 140 + insets.bottom }]}>
        <Text variant="footnote" color="secondary">
          {t('reschedule.now', { when: label(appointment.start_at) })}
        </Text>

        <View style={styles.monthRow}>
          <Text variant="bodyStrong">{month}</Text>
          {showZone ? (
            <Text variant="caption" color="tertiary">
              {t('reschedule.zone', { zone: zone.split('/').pop()?.replace(/_/g, ' ') })}
            </Text>
          ) : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.days}
          style={styles.daysScroll}>
          {days.map((key) => {
            const on = key === dayKey;
            const local = DateTime.fromISO(key, { zone });
            const working = !!workdayOf(key)?.enabled;
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${weekdays[local.weekday - 1]} ${local.day}`}
                onPress={() => {
                  setDayKey(key);
                  setSlot(null);
                }}
                style={[styles.day, on && styles.dayOn, !working && !on && styles.dayOff]}>
                <Text variant="caption" color={on ? 'onAccent' : 'secondary'}>
                  {weekdays[local.weekday - 1]}
                </Text>
                <Text variant="tile" color={on ? 'onAccent' : 'primary'} tabularNums>
                  {local.day}
                </Text>
                <View
                  style={[styles.dayDot, working && (on ? styles.dayDotOn : styles.dayDotWorking)]}
                />
              </Pressable>
            );
          })}
        </ScrollView>

        {groups === null ? (
          <Skeleton height={150} radius={12} />
        ) : groups.length === 0 ? (
          <Text variant="footnote" color="tertiary" style={styles.noSlots}>
            {workdayOf(dayKey)?.enabled ? t('reschedule.full') : t('reschedule.dayOff')}
          </Text>
        ) : (
          groups.map((group) => (
            <View key={group.part} style={styles.group}>
              <Text variant="footnote" color="tertiary">
                {t(`reschedule.parts.${group.part}`)}
              </Text>
              <View style={styles.grid}>
                {group.slots.map((iso) => {
                  const on = iso === slot;
                  return (
                    <Pressable
                      key={iso}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      onPress={() => setSlot(iso)}
                      style={[styles.slot, on && styles.slotOn]}>
                      <Text variant="bodyStrong" color={on ? 'onAccent' : 'primary'} tabularNums>
                        {time(iso)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}

        <Button
          label={t('reschedule.manual')}
          variant="ghost"
          onPress={() => setManualOpen(true)}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          label={slot ? t('reschedule.submit', { when: label(slot) }) : t('reschedule.pick')}
          disabled={!slot}
          loading={update.isPending}
          onPress={save}
          fullWidth
        />
      </View>

      <TimePicker
        visible={manualOpen}
        value={DateTime.fromISO(slot ?? appointment.start_at, { zone: 'utc' })
          .setZone(zone)
          .toFormat('HH:mm')}
        title={t('reschedule.manual')}
        cancelLabel={t('common.cancel')}
        doneLabel={t('common.confirm')}
        onCancel={() => setManualOpen(false)}
        onConfirm={pickManual}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  grabber: {
    alignSelf: 'center',
    marginTop: theme.space[2],
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.border.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.space[1.5],
    paddingHorizontal: theme.space[3],
  },
  title: { flex: 1 },
  headerSpacer: { width: theme.sizing.iconButton },
  content: { paddingTop: theme.space[3], paddingHorizontal: theme.space[4], gap: theme.space[4.5] },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -theme.space[2],
  },
  daysScroll: { marginHorizontal: -theme.space[4], flexGrow: 0 },
  days: { gap: theme.space[1.5], paddingHorizontal: theme.space[4] },
  day: {
    width: 52,
    height: 72,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[1],
  },
  dayOn: { backgroundColor: theme.colors.accent.default, borderColor: theme.colors.accent.default },
  dayOff: { opacity: 0.45 },
  dayDot: { width: 4, height: 4, borderRadius: 2 },
  dayDotWorking: { backgroundColor: theme.colors.content.primary },
  dayDotOn: { backgroundColor: theme.colors.accent.onAccent },
  noSlots: { paddingVertical: theme.space[4] },
  group: { gap: theme.space[2] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[1.5] },
  slot: {
    width: '23.5%',
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotOn: {
    backgroundColor: theme.colors.accent.default,
    borderColor: theme.colors.accent.default,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: theme.space[3],
    paddingHorizontal: theme.space[4],
    backgroundColor: theme.colors.bg.elevated,
    boxShadow: theme.shadow.panel,
  },
}));
