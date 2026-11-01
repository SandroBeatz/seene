/**
 * "Своё время" (design "AppNewTimeCustom"): any start on the chosen day — off the
 * grid, outside working hours — on hour and minute wheels; under them the visit's
 * span by its services and a warning when it runs into another visit or personal
 * time. "Готово" hands the start back. A native sheet over the time picker.
 */
import { useState } from 'react';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { clientName, useClientsQuery } from '@/entities/client';
import { formatDurationLabel } from '@/shared/lib/i18n';
import { firstOverlap } from '@/shared/lib/scheduling';
import { toUtcIsoFromWallClock } from '@/shared/lib/time-zone';
import { Button, Icon, SheetChrome, Text, useNow } from '@/shared/ui';
import { useDayGrid } from '../model/useDayGrid';
import { useTimeContext } from '../model/useTimeContext';
import { ClockWheels } from './ClockWheels';

const MINUTE_STEP = 5;
const DEFAULT_START = { hour: 10, minute: 0 };

export interface OwnTimeSheetProps {
  /** The visit's length, minutes. */
  duration: number;
  /** The visit being moved: its own time is not a conflict. */
  excludeId?: string;
  /** The day the start goes on, "yyyy-MM-dd"; null = today. */
  dayKey: string | null;
  /** The start chosen now (UTC ISO): the wheels open on it when it's that day. */
  value: string | null;
  onDone: (start: string) => void;
}

export function OwnTimeSheet({
  duration,
  excludeId,
  dayKey: chosenDay,
  value,
  onDone,
}: OwnTimeSheetProps) {
  const { t } = useTranslation();
  const ctx = useTimeContext();
  const { zone } = ctx;
  const clients = useClientsQuery(ctx.userId);
  const insets = useSafeAreaInsets();
  const now = useNow();
  const dayKey = chosenDay ?? DateTime.fromMillis(now, { zone }).toISODate()!;

  const grid = useDayGrid({
    userId: ctx.userId,
    zone,
    schedule: ctx.schedule,
    stepMinutes: ctx.stepMinutes,
    duration,
    now,
    fromKey: dayKey,
    toKey: dayKey,
    excludeId,
  });

  const [clock, setClock] = useState(() => {
    if (value && ctx.dayKeyOf(value) === dayKey) {
      const local = DateTime.fromISO(value, { zone: 'utc' }).setZone(zone);
      return { hour: local.hour, minute: local.minute - (local.minute % MINUTE_STEP) };
    }
    const workday = grid.workdayOf(dayKey);
    if (workday?.enabled) {
      const [hour, minute] = workday.start.split(':').map(Number);
      return { hour, minute: minute - (minute % MINUTE_STEP) };
    }
    return DEFAULT_START;
  });

  const [year, month, day] = dayKey.split('-').map(Number);
  const start = toUtcIsoFromWallClock({ year, month, day, ...clock }, zone);

  // Cheap (one day's records): worked out on each render, no memo to keep in sync.
  const conflict = (() => {
    if (grid.isPending) return null;
    const { visits, blocks } = grid.dayRecords(dayKey);
    const visit = firstOverlap(start, duration, visits);
    if (visit) {
      const client = clients.data?.find((c) => c.id === visit.client_id);
      return t('quickCreate.time.overlapVisit', {
        name: client ? clientName(client) : t('quickCreate.time.someone'),
        time: ctx.time(visit.start_at),
      });
    }
    const startMs = new Date(start).getTime();
    const endMs = startMs + duration * 60_000;
    const block = blocks.find(
      (b) => startMs < new Date(b.end_at).getTime() && endMs > new Date(b.start_at).getTime(),
    );
    return block ? t('quickCreate.time.overlapBlock', { time: ctx.time(block.start_at) }) : null;
  })();

  const done = () => {
    onDone(start);
    router.back();
  };

  return (
    <View style={styles.root} collapsable={false}>
      <SheetChrome title={t('quickCreate.time.own')} leadingLabel={t('common.close')} spacer />
      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <ClockWheels
          hour={clock.hour}
          minute={clock.minute}
          minuteStep={MINUTE_STEP}
          onChange={(hour, minute) => setClock({ hour, minute })}
        />
        <View style={styles.span}>
          <Text variant="bodyStrong" tabularNums>
            {ctx.range(start, duration).replace('–', ' – ')}
          </Text>
          <Text variant="body" color="tertiary">
            {`· ${t('quickCreate.time.byServices', { duration: formatDurationLabel(duration, t) })}`}
          </Text>
        </View>
        {conflict ? (
          <View style={styles.warning} accessibilityRole="alert">
            <Icon name="warning" size="base" color="tone.warning.fg" />
            <Text variant="subhead" style={styles.warningText}>
              {conflict}
            </Text>
          </View>
        ) : null}
        <Button label={t('quickCreate.time.done')} onPress={done} fullWidth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  content: {
    paddingTop: theme.space[2],
    paddingHorizontal: theme.space[4],
    gap: theme.space[3.5],
  },
  span: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    gap: theme.space[1.5],
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2.5],
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.tone.warning.bg,
  },
  warningText: { flex: 1, color: theme.colors.tone.warning.fg },
}));
