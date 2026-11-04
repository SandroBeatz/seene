/**
 * "Завершить визит" (design AppEventFinish): the amount — the appointment's price,
 * editable — the payment method and the visit's actual time, then
 * `complete_appointment` in one transaction.
 */
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import {
  appointmentKeys,
  invalidateAppointmentCaches,
  type Appointment,
} from '@/entities/appointment';
import {
  useEnsureSystemPaymentTypesMutation,
  usePaymentTypesQuery,
  type PaymentType,
} from '@/entities/payment-type';
import { useCompleteAppointmentMutation } from '@/entities/sale';
import { useUserId } from '@/entities/session';
import type { ServiceWithCategory } from '@/entities/service';
import { formatAmount, formatTime } from '@/shared/lib/formats';
import { formatDurationLabel, type AppLocale } from '@/shared/lib/i18n';
import {
  AmountInput,
  Button,
  Icon,
  SheetChrome,
  Text,
  TimePicker,
  useNow,
  showFailedToast,
  showToast,
} from '@/shared/ui';
import {
  clockOf,
  defaultMethodId,
  defaultVisitWindow,
  saleItems,
  visitChanges,
  windowFromClocks,
  type VisitWindow,
} from '../model/checkout';
import { parseAmount } from '../model/services';
import { PaymentMethodGrid } from './PaymentMethodGrid';

export interface CheckoutEditorProps {
  appointment: Appointment;
  services: ServiceWithCategory[];
  /** "Айгерим Касымова". */
  clientName: string;
  zone: string;
  currency: string;
  currencyLabel: string;
  timeFormat: 12 | 24;
  locale: AppLocale;
}

type Editing = 'start' | 'end' | null;

export function CheckoutEditor({
  appointment,
  services,
  clientName,
  zone,
  currency,
  currencyLabel,
  timeFormat,
  locale,
}: CheckoutEditorProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const userId = useUserId() ?? '';
  const methods = usePaymentTypesQuery(userId);
  const seed = useEnsureSystemPaymentTypesMutation(userId);
  const complete = useCompleteAppointmentMutation(userId);
  const now = useNow();

  const items = saleItems(appointment.service_ids, services);
  const planned = appointment.price ?? items.reduce((sum, item) => sum + item.price, 0);
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });

  const [amountInput, setAmountInput] = useState<string | null>(null);
  const [methodId, setMethodId] = useState<string | null>(null);
  const [visit, setVisit] = useState<VisitWindow>(() => defaultVisitWindow(appointment, now));
  const [timeOpen, setTimeOpen] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);

  const active = (methods.data ?? []).filter((m) => m.is_active);
  const chosen = methodId ?? defaultMethodId(methods.data ?? []);
  const amount = amountInput === null ? planned : (parseAmount(amountInput) ?? 0);

  // A master who never opened payment settings has no methods yet: seed cash and card.
  const { mutate: seedMethods } = seed;
  const needsSeed = methods.isSuccess && methods.data.length === 0;
  useEffect(() => {
    if (needsSeed) seedMethods();
  }, [needsSeed, seedMethods]);

  const endAt = new Date(Date.parse(visit.start_at) + visit.duration * 60_000).toISOString();
  const time = (iso: string) => formatTime(iso, { zone, timeFormat });
  const timeChanged =
    Date.parse(visit.start_at) !== Date.parse(appointment.start_at) ||
    visit.duration !== appointment.duration;
  const plannedEnd = new Date(
    Date.parse(appointment.start_at) + appointment.duration * 60_000,
  ).toISOString();

  const methodLabel = (m: PaymentType) =>
    m.kind === 'custom' ? m.name : t(`checkout.methods.${m.kind}`);

  const pickClock = (clock: string) => {
    const startClock = editing === 'start' ? clock : clockOf(visit.start_at, zone);
    const endClock = editing === 'end' ? clock : clockOf(endAt, zone);
    setEditing(null);
    const next = windowFromClocks(appointment.start_at, zone, startClock, endClock);
    if (!next) return Alert.alert(t('servicesSheet.badDuration'));
    setVisit(next);
  };

  const submit = () => {
    const changes = visitChanges(appointment, visit);
    complete.mutate(
      {
        appointmentId: appointment.id,
        amount,
        paymentTypeId: chosen,
        items,
        startAt: changes.start_at,
        duration: changes.duration,
      },
      {
        onSuccess: () => {
          const method = active.find((m) => m.id === chosen);
          showToast({
            title: t('toasts.visitFinished', {
              amount: formatAmount(amount, { currency, locale }),
            }),
            summary: [clientName.split(' ')[0], method && methodLabel(method)]
              .filter(Boolean)
              .join(' · '),
          });
          router.back();
        },
        onError: () => showFailedToast(submit),
        onSettled: () => {
          invalidateAppointmentCaches(qc, userId);
          qc.invalidateQueries({ queryKey: appointmentKeys.detail(appointment.id) });
        },
      },
    );
  };

  return (
    // Kept as a real view: a form sheet (react-native-screens) pins a ScrollView that
    // is a direct child of the screen to the top and stretches it over the header.
    <View style={styles.root} collapsable={false}>
      <SheetChrome title={t('checkout.title')} leadingLabel={t('common.close')} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
        keyboardShouldPersistTaps="handled">
        <Text variant="caption" color="tertiary" align="center" tabularNums numberOfLines={1}>
          {[clientName.split(' ')[0], `${time(visit.start_at)}–${time(endAt)}`]
            .filter(Boolean)
            .join(' · ')}
        </Text>

        <Text variant="captionMedium" color="secondary" style={styles.label}>
          {t('checkout.toPay')}
        </Text>
        <View style={styles.amount}>
          <AmountInput
            accessibilityLabel={t('checkout.amountA11y', { currency: currencyLabel })}
            value={amountInput ?? number.format(planned)}
            onChangeText={setAmountInput}
            selectTextOnFocus
            style={styles.amountInput}
          />
          <Text variant="body" color="tertiary">
            {currencyLabel}
          </Text>
        </View>
        <Text variant="caption" color="tertiary" tabularNums style={styles.label}>
          {amount !== planned
            ? t('checkout.planned', { amount: formatAmount(planned, { currency, locale }) })
            : t('checkout.canChange')}
        </Text>

        <Text variant="captionMedium" color="secondary" style={[styles.label, styles.section]}>
          {t('checkout.method')}
        </Text>
        <PaymentMethodGrid methods={active} value={chosen} onChange={setMethodId} />

        <View style={[styles.timeCard, styles.time]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: timeOpen }}
            onPress={() => setTimeOpen((open) => !open)}
            style={styles.timeRow}>
            <Icon name="clock" size="base" color="content.tertiary" />
            <View style={styles.grow}>
              <Text variant="bodyStrong" tabularNums>
                {`${time(visit.start_at)} – ${time(endAt)} · ${formatDurationLabel(visit.duration, t)}`}
              </Text>
              <Text variant="footnote" color="tertiary" tabularNums>
                {timeChanged
                  ? t('checkout.plannedTime', {
                      range: `${time(appointment.start_at)} – ${time(plannedEnd)}`,
                    })
                  : t('checkout.asPlanned')}
              </Text>
            </View>
            <Text variant="footnoteStrong" color="brand">
              {timeOpen ? t('checkout.done') : t('checkout.change')}
            </Text>
          </Pressable>
          {timeOpen ? (
            <View style={styles.clocks}>
              {(['start', 'end'] as const).map((which) => (
                <Pressable
                  key={which}
                  accessibilityRole="button"
                  onPress={() => setEditing(which)}
                  style={styles.clock}>
                  <Text variant="caption2" color="tertiary">
                    {t(`checkout.${which}`)}
                  </Text>
                  <Text variant="calloutStrong" tabularNums>
                    {time(which === 'start' ? visit.start_at : endAt)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          label={t('checkout.submit', { amount: formatAmount(amount, { currency, locale }) })}
          leftIcon="completeVisit"
          loading={complete.isPending}
          onPress={submit}
          fullWidth
        />
      </View>

      <TimePicker
        visible={editing !== null}
        value={clockOf(editing === 'end' ? endAt : visit.start_at, zone)}
        title={editing ? t(`checkout.${editing}`) : ''}
        cancelLabel={t('common.cancel')}
        doneLabel={t('common.confirm')}
        onCancel={() => setEditing(null)}
        onConfirm={pickClock}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  content: { paddingTop: theme.space[4], paddingHorizontal: theme.space[4] },
  label: { marginTop: theme.space[2], paddingLeft: theme.space[1] },
  amount: {
    marginTop: theme.space[2],
    height: 56,
    paddingHorizontal: theme.space[4],
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.bg.surface,
  },
  amountInput: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.content.primary,
    ...theme.typography.title2,
    fontVariant: ['tabular-nums'],
  },
  section: { marginTop: theme.space[4], marginBottom: theme.space[2] },
  grow: { flex: 1, minWidth: 0, gap: 2 },
  time: { marginTop: theme.space[4] },
  timeCard: {
    borderRadius: theme.radius.block,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    overflow: 'hidden',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    padding: theme.space[3.5],
  },
  clocks: {
    flexDirection: 'row',
    gap: theme.space[2],
    paddingHorizontal: theme.space[3.5],
    paddingBottom: theme.space[3.5],
  },
  clock: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: theme.space[3],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg.surface,
  },
  note: { marginTop: theme.space[2] },
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
