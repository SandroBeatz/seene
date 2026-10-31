/**
 * "Своё время" (design "AppNewTimeCustom"): any start on the chosen day — off the
 * grid, outside working hours — on hour and minute wheels; under them the visit's
 * span by its services and a warning when it runs into another visit or personal
 * time. "Готово" puts it into the draft. A native sheet over the flow.
 */
import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { clientName } from '@/entities/client';
import { formatDurationLabel } from '@/shared/lib/i18n';
import { firstOverlap } from '@/shared/lib/scheduling';
import { toUtcIsoFromWallClock } from '@/shared/lib/time-zone';
import { Button, Icon, SheetChrome, Text, useNow } from '@/shared/ui';
import { useDayGrid } from '../model/useDayGrid';
import { useFlowData } from '../model/useFlowData';
import { ClockWheels } from './ClockWheels';

const MINUTE_STEP = 5;
const DEFAULT_START = { hour: 10, minute: 0 };

export function CustomTimeSheet() {
  const flow = useFlowData();
  const { t, zone, draft } = flow;
  const insets = useSafeAreaInsets();
  const now = useNow();
  const dayKey = draft.dayKey ?? DateTime.fromMillis(now, { zone }).toISODate()!;

  const grid = useDayGrid({
    userId: flow.userId,
    zone,
    schedule: flow.schedule,
    stepMinutes: flow.stepMinutes,
    duration: flow.duration,
    now,
    fromKey: dayKey,
    toKey: dayKey,
  });

  const [clock, setClock] = useState(() => {
    if (draft.start && flow.dayKeyOf(draft.start) === dayKey) {
      const local = DateTime.fromISO(draft.start, { zone: 'utc' }).setZone(zone);
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

  const conflict = useMemo(() => {
    if (grid.isPending) return null;
    const { visits, blocks } = grid.dayRecords(dayKey);
    const visit = firstOverlap(start, flow.duration, visits);
    if (visit) {
      const client = flow.clients.find((c) => c.id === visit.client_id);
      return t('quickCreate.time.overlapVisit', {
        name: client ? clientName(client) : t('quickCreate.time.someone'),
        time: flow.time(visit.start_at),
      });
    }
    const startMs = new Date(start).getTime();
    const endMs = startMs + flow.duration * 60_000;
    const block = blocks.find(
      (b) => startMs < new Date(b.end_at).getTime() && endMs > new Date(b.start_at).getTime(),
    );
    return block ? t('quickCreate.time.overlapBlock', { time: flow.time(block.start_at) }) : null;
  }, [grid, start, flow, dayKey, t]);

  const done = () => {
    draft.setStart(start, true);
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
            {flow.range(start).replace('–', ' – ')}
          </Text>
          <Text variant="body" color="tertiary">
            {`· ${t('quickCreate.time.byServices', { duration: formatDurationLabel(flow.duration, t) })}`}
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
