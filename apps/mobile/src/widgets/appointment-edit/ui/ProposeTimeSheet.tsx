/**
 * "Предложить другое время": the next two weeks as one scroll, a day and its free starts for
 * a visit of this length, then the next day. The master ticks the ones to offer; "Отправить"
 * opens the send sheet with them in the message. Nothing is moved: the client answers in
 * WhatsApp and they agree there.
 */
import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import type { Appointment } from '@/entities/appointment';
import { useDayGrid, useTimeContext } from '@/features/pick-time';
import { Button, SheetChrome, Skeleton, Text, useNow } from '@/shared/ui';

/** How far ahead the master can offer. */
export const PROPOSE_DAYS = 14;

export interface ProposeTimeSheetProps {
  appointment: Appointment;
}

export function ProposeTimeSheet({ appointment }: ProposeTimeSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const ctx = useTimeContext();
  const now = useNow();
  const [picked, setPicked] = useState<string[]>([]);

  const today = DateTime.fromMillis(now, { zone: ctx.zone }).startOf('day');
  const fromKey = today.toISODate()!;
  const toKey = today.plus({ days: PROPOSE_DAYS - 1 }).toISODate()!;
  const grid = useDayGrid({
    userId: ctx.userId,
    zone: ctx.zone,
    schedule: ctx.schedule,
    stepMinutes: ctx.stepMinutes,
    duration: appointment.duration,
    now,
    fromKey,
    toKey,
  });

  const days = useMemo(() => {
    if (grid.isPending) return null;
    const list: { key: string; starts: string[] }[] = [];
    for (let i = 0; i < PROPOSE_DAYS; i++) {
      const key = today.plus({ days: i }).toISODate()!;
      const starts = grid.gridOf(key).flatMap((slot) => (slot.state === 'free' ? slot.start : []));
      if (starts.length) list.push({ key, starts });
    }
    return list;
    // `today` follows `fromKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid.isPending, grid.gridOf, fromKey]);

  const toggle = (start: string) =>
    setPicked((list) =>
      list.includes(start) ? list.filter((s) => s !== start) : [...list, start],
    );

  const send = () =>
    router.replace({
      pathname: '/appointment/[appointmentId]/send',
      params: {
        appointmentId: appointment.id,
        kind: 'propose_time',
        event: t('propose.event'),
        slots: [...picked].sort().join(','),
      },
    });

  const ready = !ctx.isPending && days !== null;

  return (
    // Kept as a real view: a form sheet pins a ScrollView that is a direct child to the top.
    <View style={styles.root} collapsable={false}>
      <SheetChrome title={t('propose.title')} leadingLabel={t('common.close')} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: 140 + insets.bottom }]}
        showsVerticalScrollIndicator={false}>
        <Text variant="footnote" color="secondary">
          {t('propose.hint')}
        </Text>
        {!ready ? (
          <Skeleton height={320} radius={16} />
        ) : days.length === 0 ? (
          <Text variant="body" color="secondary" align="center" style={styles.empty}>
            {t('propose.empty', { count: PROPOSE_DAYS })}
          </Text>
        ) : (
          days.map((day) => (
            <View key={day.key} style={styles.day}>
              <Text variant="subheadStrong">{capitalize(ctx.dayLabel(day.key))}</Text>
              <View style={styles.grid}>
                {day.starts.map((start) => {
                  const on = picked.includes(start);
                  return (
                    <Pressable
                      key={start}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={`${ctx.dayLabel(day.key)}, ${ctx.time(start)}`}
                      onPress={() => toggle(start)}
                      style={[styles.slot, on && styles.slotOn]}>
                      <Text variant="bodyLarge" color={on ? 'onAccent' : 'primary'} tabularNums>
                        {ctx.time(start)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          label={picked.length ? t('propose.submit', { count: picked.length }) : t('propose.pick')}
          disabled={!picked.length}
          onPress={send}
          fullWidth
        />
      </View>
    </View>
  );
}

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase() + text.slice(1);

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  content: { paddingTop: theme.space[3], paddingHorizontal: theme.space[4], gap: theme.space[5] },
  empty: { paddingVertical: theme.space[6] },
  day: { gap: theme.space[2] },
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
