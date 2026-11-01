/**
 * Moving a visit: the same day and time picker as "Новая запись" (no steps), with the
 * visit's own time left free. "Перенести · Пн, 2 ноября, 15:00" saves the new start.
 */
import { useEffect } from 'react';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { useUpdateAppointmentMutation, type Appointment } from '@/entities/appointment';
import { DayTimePicker, useTimeContext } from '@/features/pick-time';
import { Button, SheetChrome, Skeleton, Text, useNow } from '@/shared/ui';
import { useRescheduleDraft } from '../model/reschedule.store';

export interface RescheduleSheetProps {
  appointment: Appointment;
}

export function RescheduleSheet({ appointment }: RescheduleSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const ctx = useTimeContext();
  const now = useNow();
  const update = useUpdateAppointmentMutation(ctx.userId);
  const draft = useRescheduleDraft();
  const { begin } = draft;

  const todayKey = DateTime.fromMillis(now, { zone: ctx.zone }).toISODate()!;
  const currentKey = ctx.dayKeyOf(appointment.start_at);
  const firstDay = currentKey >= todayKey ? currentKey : todayKey;
  // A fresh pick per visit, opened on the visit's own day.
  useEffect(() => {
    if (!ctx.isPending) begin(appointment.id, firstDay);
  }, [appointment.id, firstDay, begin, ctx.isPending]);
  const ready = draft.appointmentId === appointment.id && !ctx.isPending;

  const when = (iso: string) => `${ctx.dayLabel(ctx.dayKeyOf(iso))}, ${ctx.time(iso)}`;

  const save = () => {
    if (!draft.start) return;
    update.mutate(
      { id: appointment.id, start_at: draft.start },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
      },
    );
  };

  return (
    // Kept as a real view: a form sheet (react-native-screens) pins a ScrollView that
    // is a direct child of the screen to the top and stretches it over the header.
    <View style={styles.root} collapsable={false}>
      <SheetChrome title={t('reschedule.title')} leadingLabel={t('common.close')} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: 140 + insets.bottom }]}
        showsVerticalScrollIndicator={false}>
        <Text variant="footnote" color="secondary">
          {t('reschedule.now', { when: when(appointment.start_at) })}
        </Text>
        {ready ? (
          <DayTimePicker
            duration={appointment.duration}
            excludeId={appointment.id}
            dayKey={draft.dayKey}
            start={draft.start}
            ownTime={draft.ownTime}
            onDay={draft.setDay}
            onStart={draft.setStart}
            onOpenMonth={() =>
              router.push({
                pathname: '/appointment/[appointmentId]/reschedule-month',
                params: { appointmentId: appointment.id },
              })
            }
            onOpenOwnTime={() =>
              router.push({
                pathname: '/appointment/[appointmentId]/reschedule-time',
                params: { appointmentId: appointment.id },
              })
            }
          />
        ) : (
          <Skeleton height={320} radius={16} />
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          label={
            draft.start && ready
              ? t('reschedule.submit', { when: when(draft.start) })
              : t('reschedule.pick')
          }
          disabled={!draft.start || !ready}
          loading={update.isPending}
          onPress={save}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  content: { paddingTop: theme.space[3], paddingHorizontal: theme.space[4], gap: theme.space[4] },
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
