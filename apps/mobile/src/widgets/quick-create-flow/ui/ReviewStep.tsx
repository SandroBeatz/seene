/**
 * "Новая запись · 4 из 4: проверка" (design "AppNewReview"): the client, services and
 * time — each with a pencil back to its step — the price for this appointment (from
 * the price list; a change affects only this one) and a note. "Создать" writes a
 * confirmed manual appointment, closes the flow and shows "Запись создана" on Today.
 */
import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useCreateAppointmentMutation } from '@/entities/appointment';
import { clientName } from '@/entities/client';
import { parseAmount } from '@/features/appointment-actions';
import { formatDurationLabel } from '@/shared/lib/i18n';
import { formatPhone } from '@/shared/lib/phone';
import { Avatar, Icon, Text, type IconName } from '@/shared/ui';
import { useCreatedAppointment } from '../model/created.store';
import { useFlowData } from '../model/useFlowData';
import { StepChrome, useCloseFlow } from './StepChrome';
import { StepFooter } from './StepFooter';

const NOTE_MAX_LENGTH = 500;

export function ReviewStep() {
  const flow = useFlowData();
  const { t, zone, draft, client } = flow;
  const { theme } = useUnistyles();
  const create = useCreateAppointmentMutation(flow.userId);
  const showCreated = useCreatedAppointment((s) => s.show);
  const close = useCloseFlow();

  const start = draft.start;
  const typedPrice = draft.price === null ? null : parseAmount(draft.price);
  const price = typedPrice ?? flow.listPrice;
  const number = new Intl.NumberFormat(flow.locale, { maximumFractionDigits: 2 });

  const weekdays = t('weekdays.short', { returnObjects: true }) as string[];
  const monthsGenitive = t('monthsGenitive', { returnObjects: true }) as string[];
  const monthsShort = t('monthsShort', { returnObjects: true }) as string[];
  const local = start ? DateTime.fromISO(start, { zone: 'utc' }).setZone(zone) : null;
  const longDay = local
    ? `${weekdays[local.weekday - 1]}, ${local.day} ${monthsGenitive[local.month - 1]}`
    : '';
  const shortDay = local
    ? `${weekdays[local.weekday - 1]} ${local.day} ${monthsShort[local.month - 1]}`
    : '';

  const submit = () => {
    if (!client || !start || flow.picked.length === 0) return;
    create.mutate(
      {
        client_id: client.id,
        service_ids: flow.picked.map((s) => s.id),
        start_at: start,
        duration: flow.duration,
        price: typedPrice === null || typedPrice === flow.listPrice ? null : typedPrice,
        notes: draft.note.trim() || null,
        status: 'confirmed',
        source: 'manual',
      },
      {
        onSuccess: (appointment) => {
          const when = `${shortDay.toLocaleLowerCase()}, ${flow.range(start)}`;
          showCreated({
            appointmentId: appointment.id,
            summary: `${client.first_name} · ${when}`,
            phone: client.whatsapp ?? client.phone,
            message: t('actions.messages.details', {
              name: client.first_name,
              when,
              services: flow.picked.map((s) => s.name).join(', '),
              price: flow.money(price),
            }),
          });
          close();
        },
        onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
      },
    );
  };

  if (!client || !start) return null;

  return (
    <View style={styles.root} collapsable={false}>
      <StepChrome step={4} subtitle={t('quickCreate.review.subtitle')} client={client} />

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={110}>
        <View style={styles.card}>
          <Row
            label={t('quickCreate.review.client')}
            title={clientName(client)}
            detail={client.phone ? formatPhone(client.phone) : undefined}
            leading={<Avatar name={clientName(client)} color={client.avatar_color} size="lg" />}
            editLabel={t('quickCreate.review.editClient')}
            onEdit={() => router.dismissTo('/quick-create')}
          />
          <Row
            label={t('quickCreate.review.services')}
            title={flow.picked.map((s) => s.name).join(', ')}
            detail={formatDurationLabel(flow.duration, t)}
            icon="services"
            editLabel={t('quickCreate.review.editServices')}
            onEdit={() => router.dismissTo('/quick-create/services')}
          />
          <Row
            label={t('quickCreate.review.when')}
            title={longDay}
            detail={flow.range(start).replace('–', ' – ')}
            icon="calendar"
            editLabel={t('quickCreate.review.editWhen')}
            onEdit={() => router.dismissTo('/quick-create/date-time')}
            last
          />
        </View>

        <View style={styles.field}>
          <View style={styles.grow}>
            <Text variant="footnote" color="tertiary">
              {t('quickCreate.review.price')}
            </Text>
            <TextInput
              accessibilityLabel={t('quickCreate.review.priceA11y', {
                currency: flow.currencyLabel,
              })}
              value={draft.price ?? number.format(flow.listPrice)}
              onChangeText={draft.setPrice}
              keyboardType="number-pad"
              style={styles.priceInput}
            />
          </View>
          <Text variant="bodyStrong" color="tertiary">
            {flow.currencyLabel}
          </Text>
        </View>
        <Text variant="footnote" color="tertiary" style={styles.hint}>
          {t('quickCreate.review.priceHint')}
        </Text>

        <View style={[styles.field, styles.noteField]}>
          <View style={styles.grow}>
            <Text variant="footnote" color="tertiary">
              {t('quickCreate.review.note')}
            </Text>
            <TextInput
              accessibilityLabel={t('quickCreate.review.note')}
              value={draft.note}
              onChangeText={draft.setNote}
              placeholder={t('quickCreate.review.notePlaceholder')}
              placeholderTextColor={theme.colors.content.tertiary}
              maxLength={NOTE_MAX_LENGTH}
              multiline
              style={styles.noteInput}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      <StepFooter
        title={t('quickCreate.review.total', { price: flow.money(price) })}
        subtitle={`${shortDay} · ${flow.range(start)}`}
        actionLabel={t('quickCreate.review.create')}
        actionIcon="check"
        loading={create.isPending}
        onAction={submit}
      />
    </View>
  );
}

function Row({
  label,
  title,
  detail,
  leading,
  icon,
  editLabel,
  onEdit,
  last = false,
}: {
  label: string;
  title: string;
  detail?: string;
  leading?: ReactNode;
  icon?: IconName;
  editLabel: string;
  onEdit: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={editLabel}
      onPress={onEdit}
      style={({ pressed }) => [styles.row, !last && styles.rowDivider, pressed && styles.pressed]}>
      {leading ?? (
        <View style={styles.rowIcon}>
          <Icon name={icon ?? 'services'} size="md" color="content.secondary" />
        </View>
      )}
      <View style={styles.grow}>
        <Text variant="footnote" color="tertiary">
          {label}
        </Text>
        <Text variant="bodyStrong" numberOfLines={2}>
          {title}
        </Text>
        {detail ? (
          <Text variant="footnote" color="tertiary" tabularNums>
            {detail}
          </Text>
        ) : null}
      </View>
      <Icon name="pencil" size="sm" color="content.tertiary" />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  scroll: { flex: 1 },
  content: {
    paddingTop: theme.space[4],
    paddingHorizontal: theme.space[4],
    paddingBottom: 150,
  },
  card: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: theme.space[3.5],
    paddingHorizontal: theme.space[3.5],
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: theme.colors.border.subtle },
  rowIcon: {
    width: theme.sizing.avatar.lg,
    height: theme.sizing.avatar.lg,
    borderRadius: theme.sizing.avatar.lg / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.surface,
  },
  grow: { flex: 1, minWidth: 0, gap: 2 },
  pressed: { opacity: 0.7 },
  field: {
    marginTop: theme.space[2.5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg.surface,
  },
  priceInput: {
    padding: 0,
    color: theme.colors.content.primary,
    ...theme.typography.tile,
  },
  hint: { marginTop: theme.space[2], paddingHorizontal: theme.space[1] },
  noteField: { marginTop: theme.space[3], alignItems: 'flex-start' },
  noteInput: {
    minHeight: 48,
    padding: 0,
    color: theme.colors.content.primary,
    textAlignVertical: 'top',
    ...theme.typography.body,
  },
}));
