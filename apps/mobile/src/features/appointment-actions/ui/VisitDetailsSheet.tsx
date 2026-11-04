/**
 * A tap on a chip of the visit card (design AppEventEditTime, AppEventEditSheet): "Время и сумма"
 * before it is finished, "Время и оплата" after, when the sale changes with it.
 */
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  invalidateAppointmentCaches,
  sumServicePrice,
  useUpdateAppointmentMutation,
  type Appointment,
} from '@/entities/appointment';
import { useMoneyContext } from '@/entities/master';
import { usePaymentTypesQuery } from '@/entities/payment-type';
import { useSaleByAppointmentQuery, useUpdateFinishedVisitMutation } from '@/entities/sale';
import { useServicesQuery } from '@/entities/service';
import { useUserId } from '@/entities/session';
import { formatTime } from '@/shared/lib/formats';
import { formatDurationLabel } from '@/shared/lib/i18n';
import { AmountInput, Button, FormScreen, SheetChrome, Text, showFailedToast } from '@/shared/ui';
import { parseAmount } from '../model/services';
import { useVisitSavedToast } from '../model/useVisitSavedToast';
import { durationOptions } from '../model/visit-details';
import { PaymentMethodGrid } from './PaymentMethodGrid';

export function VisitDetailsSheet({ appointment }: { appointment: Appointment }) {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const qc = useQueryClient();
  const money = useMoneyContext(userId);
  const finished = appointment.status === 'completed';
  const services = useServicesQuery(userId).data ?? [];
  const sale = useSaleByAppointmentQuery(finished ? appointment.id : undefined).data;
  const methods = usePaymentTypesQuery(userId).data ?? [];
  const update = useUpdateAppointmentMutation(userId);
  const updateFinished = useUpdateFinishedVisitMutation(userId);
  const showSaved = useVisitSavedToast(appointment);

  const listPrice = sumServicePrice(
    appointment.service_ids.flatMap((id) => services.find((s) => s.id === id) ?? []),
  );
  const current = (finished ? sale?.amount : appointment.price) ?? listPrice;

  const [duration, setDuration] = useState(appointment.duration);
  const [amountInput, setAmountInput] = useState<string | null>(null);
  const [methodId, setMethodId] = useState<string | null>(null);
  const amount = amountInput === null ? current : (parseAmount(amountInput) ?? 0);
  const chosen = methodId ?? sale?.payment_type_id ?? null;
  const shownMethods = methods.filter((m) => m.is_active || m.id === sale?.payment_type_id);

  const endsAt = new Date(Date.parse(appointment.start_at) + duration * 60_000).toISOString();
  const pending = update.isPending || updateFinished.isPending;

  const done = () => {
    showSaved();
    router.back();
  };

  const save = () => {
    if (finished) {
      updateFinished.mutate(
        { appointmentId: appointment.id, amount, paymentTypeId: chosen, duration },
        {
          onSuccess: done,
          onError: () => showFailedToast(save),
          onSettled: () => invalidateAppointmentCaches(qc, userId),
        },
      );
    } else {
      update.mutate(
        {
          id: appointment.id,
          duration,
          // The price list again: no override stays behind.
          price: amount === listPrice ? null : amount,
        },
        { onSuccess: done, onError: () => showFailedToast(save) },
      );
    }
  };

  return (
    <FormScreen
      edges={['left', 'right', 'bottom']}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      footer={
        <Button
          label={t('common.save')}
          disabled={finished && !sale}
          loading={pending}
          onPress={save}
          fullWidth
        />
      }>
      <SheetChrome
        title={t(finished ? 'visitDetails.titleFinished' : 'visitDetails.title')}
        leadingLabel={t('common.close')}
      />

      <Text variant="captionMedium" color="secondary" style={styles.label}>
        {t('visitDetails.duration')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.scroller}
        contentContainerStyle={styles.durations}>
        {durationOptions(appointment.duration).map((minutes) => {
          const on = minutes === duration;
          return (
            <Pressable
              key={minutes}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => setDuration(minutes)}
              style={[styles.duration, on && styles.durationOn]}>
              <Text variant="subheadStrong" tabularNums color={on ? 'onAccent' : 'primary'}>
                {formatDurationLabel(minutes, t)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {finished ? null : (
        <Text variant="caption" color="tertiary" tabularNums style={styles.label}>
          {t('visitDetails.endsAt', {
            time: formatTime(endsAt, { zone: money.zone, timeFormat: money.timeFormat }),
          })}
        </Text>
      )}

      <Text variant="captionMedium" color="secondary" style={[styles.label, styles.section]}>
        {t('visitDetails.amount')}
      </Text>
      <View style={styles.amount}>
        <AmountInput
          accessibilityLabel={t('checkout.amountA11y', { currency: money.currencyLabel })}
          value={amountInput ?? money.number(current)}
          onChangeText={setAmountInput}
          selectTextOnFocus
          style={styles.amountInput}
        />
        <Text variant="body" color="tertiary">
          {money.currencyLabel}
        </Text>
      </View>
      <Text variant="caption" color="tertiary" tabularNums style={styles.label}>
        {t('visitDetails.listPrice', { amount: money.money(listPrice) })}
      </Text>

      {finished ? (
        <>
          <Text variant="captionMedium" color="secondary" style={[styles.label, styles.section]}>
            {t('visitDetails.payment')}
          </Text>
          <PaymentMethodGrid methods={shownMethods} value={chosen} onChange={setMethodId} />
        </>
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { gap: theme.space[2], paddingTop: theme.space[3] },
  label: { paddingLeft: theme.space[1] },
  section: { marginTop: theme.space[2] },
  scroller: { flexGrow: 0, marginHorizontal: -theme.layout.gutter },
  durations: { gap: 6, paddingHorizontal: theme.layout.gutter },
  duration: {
    height: 36,
    paddingHorizontal: theme.space[3.5],
    borderRadius: 18,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  durationOn: {
    backgroundColor: theme.colors.accent.default,
    borderColor: theme.colors.accent.default,
  },
  amount: {
    height: 50,
    paddingHorizontal: theme.space[3.5],
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.bg.surface,
  },
  amountInput: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.content.primary,
    ...theme.typography.headline,
    fontVariant: ['tabular-nums'],
  },
}));
