/**
 * Moving a visit: the same day and time picker as "Новая запись" (no steps), with the
 * visit's own time left free. "Перенести · Пн, 2 ноября, 15:00" saves the new start and
 * shows "Запись перенесена" with "Отправить клиенту": the client doesn't know yet.
 */
import { useEffect } from 'react';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import {
  sumServicePrice,
  useUpdateAppointmentMutation,
  type Appointment,
} from '@/entities/appointment';
import { useClientQuery } from '@/entities/client';
import { useMasterSettingsQuery } from '@/entities/master';
import { useServicesQuery } from '@/entities/service';
import { useAppointmentToast } from '@/features/appointment-actions';
import { DayTimePicker, useTimeContext } from '@/features/pick-time';
import { formatAmount } from '@/shared/lib/formats';
import { isSupportedLocale } from '@/shared/lib/i18n';
import { Button, SheetChrome, Skeleton, Text, useNow } from '@/shared/ui';
import { useRescheduleDraft } from '../model/reschedule.store';

export interface RescheduleSheetProps {
  appointment: Appointment;
}

export function RescheduleSheet({ appointment }: RescheduleSheetProps) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const ctx = useTimeContext();
  const now = useNow();
  const update = useUpdateAppointmentMutation(ctx.userId);
  const client = useClientQuery(appointment.client_id);
  const services = useServicesQuery(ctx.userId);
  const settings = useMasterSettingsQuery(ctx.userId);
  const showToast = useAppointmentToast((s) => s.show);
  const draft = useRescheduleDraft();
  const { begin } = draft;

  const todayKey = DateTime.fromMillis(now, { zone: ctx.zone }).toISODate()!;
  const currentKey = ctx.dayKeyOf(appointment.start_at);
  const firstDay = currentKey >= todayKey ? currentKey : todayKey;
  // A fresh pick per visit, opened on the visit's own day.
  useEffect(() => {
    if (!ctx.isPending) begin(appointment.id, firstDay);
  }, [appointment.id, firstDay, begin, ctx.isPending]);
  // The toast's text needs the client and the services too.
  const ready =
    draft.appointmentId === appointment.id &&
    !ctx.isPending &&
    !client.isPending &&
    !services.isPending;

  const when = (iso: string) => `${ctx.dayLabel(ctx.dayKeyOf(iso))}, ${ctx.time(iso)}`;

  const movedToast = (start: string) => {
    const person = client.data;
    const span = `${ctx.dayLabel(ctx.dayKeyOf(start)).toLocaleLowerCase()}, ${ctx.range(start, appointment.duration)}`;
    const picked = (services.data ?? []).filter((s) => appointment.service_ids.includes(s.id));
    return {
      title: t('reschedule.done'),
      summary: person ? `${person.first_name} · ${span}` : span,
      phone: person?.whatsapp ?? person?.phone ?? null,
      message: t('actions.messages.moved', {
        name: person?.first_name ?? '',
        when: span,
        services: picked.map((s) => s.name).join(', '),
        price: formatAmount(appointment.price ?? sumServicePrice(picked), {
          currency: settings.data?.currency ?? 'EUR',
          locale: isSupportedLocale(i18n.language) ? i18n.language : 'en',
        }),
      }),
    };
  };

  const save = () => {
    const start = draft.start;
    if (!start) return;
    // Its own time is free in the grid; picking it moves nothing.
    if (new Date(start).getTime() === new Date(appointment.start_at).getTime()) {
      return router.back();
    }
    update.mutate(
      { id: appointment.id, start_at: start },
      {
        onSuccess: () => {
          showToast(movedToast(start));
          router.back();
        },
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
