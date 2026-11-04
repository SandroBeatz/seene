/**
 * "Отправить клиенту" (design AppSendConfirm, AppSendMove, AppSendCancel): the template filled
 * in with the visit, editable, and WhatsApp with that text. wa.me can't tell whether it was sent.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { DateTime } from 'luxon';
import { appointmentTotalPrice, type Appointment } from '@/entities/appointment';
import { clientName, useClientQuery } from '@/entities/client';
import { useMoneyContext } from '@/entities/master';
import type { MessageKind } from '@/entities/message-template';
import { useServicesQuery } from '@/entities/service';
import { useUserId } from '@/entities/session';
import { formatTime } from '@/shared/lib/formats';
import { formatPhone, whatsappUrl } from '@/shared/lib/phone';
import {
  Avatar,
  Button,
  FormScreen,
  Icon,
  Input,
  SheetChrome,
  Skeleton,
  Text,
  showErrorToast,
} from '@/shared/ui';
import { useClientMessage } from '../model/useClientMessage';

export interface SendToClientSheetProps {
  appointment: Appointment;
  kind: MessageKind;
  /** "Запись создана". */
  event: string;
}

export function SendToClientSheet({ appointment, kind, event }: SendToClientSheetProps) {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const client = useClientQuery(appointment.client_id).data;
  const services = useServicesQuery(userId).data;
  const { money, timeFormat, zone } = useMoneyContext(userId);
  const composeMessage = useClientMessage();
  const [text, setText] = useState<string | null>(null);

  const ready = !!client && !!services;
  const compose = () => {
    const picked = appointment.service_ids.flatMap(
      (id) => services?.find((service) => service.id === id) ?? [],
    );
    return composeMessage({
      kind,
      clientName: client?.first_name ?? '',
      clientLanguage: client?.language,
      visit: {
        id: appointment.id,
        startAt: appointment.start_at,
        services: picked.map((service) => service.name).join(', '),
        price: money(appointmentTotalPrice(appointment, picked)),
      },
    }).then(setText);
  };

  useEffect(() => {
    if (ready) void compose();
    // Once the visit's data is here: later on the text is the master's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const phone = client?.whatsapp ?? client?.phone ?? null;
  const send = () => {
    if (!phone || !text) return;
    Linking.openURL(whatsappUrl(phone, text))
      .then(() => router.back())
      .catch(() => showErrorToast(t('actions.failedTitle')));
  };

  const weekdays = t('weekdays.short', { returnObjects: true }) as string[];
  const months = t('monthsShort', { returnObjects: true }) as string[];
  const local = DateTime.fromISO(appointment.start_at, { zone: 'utc' }).setZone(zone);
  const when =
    `${weekdays[local.weekday - 1]} ${local.day} ${months[local.month - 1]}, ${formatTime(appointment.start_at, { zone, timeFormat })}`.toLocaleLowerCase();

  return (
    <FormScreen
      edges={['left', 'right', 'bottom']}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      footer={
        <View style={styles.footer}>
          <Button
            label={t('sendToClient.send')}
            leftIcon="whatsapp"
            disabled={!text?.trim() || !phone}
            onPress={send}
            fullWidth
          />
          <Text variant="caption" color="tertiary" align="center">
            {t('sendToClient.sendHint')}
          </Text>
        </View>
      }>
      <SheetChrome title={t('actions.sendToClient')} leadingLabel={t('common.close')} />
      <Text variant="caption" color="tertiary" tabularNums align="center" numberOfLines={1}>
        {`${event} · ${when}`}
      </Text>

      <View style={styles.client}>
        <Avatar name={client ? clientName(client) : '…'} color={client?.avatar_color} size="md" />
        <View style={styles.grow}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {client ? clientName(client) : '…'}
          </Text>
          {phone ? (
            <Text variant="footnote" color="tertiary" tabularNums numberOfLines={1}>
              {formatPhone(phone)}
            </Text>
          ) : null}
        </View>
        <View style={styles.channel}>
          <Icon name="whatsapp" size={14} />
          <Text variant="caption2Strong">WhatsApp</Text>
        </View>
      </View>

      <View style={styles.templateRow}>
        <Text variant="caption" color="secondary">
          {t('sendToClient.template')}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/settings/messages')}
          style={({ pressed }) => [styles.template, pressed && styles.pressed]}>
          <Text variant="footnoteStrong" numberOfLines={1}>
            {t(`menuHome.messages.kinds.${kind}.title`)}
          </Text>
          <Icon name="chevronRight" size={14} color="content.secondary" />
        </Pressable>
      </View>

      {text === null ? (
        <Skeleton height={160} />
      ) : (
        <Input
          variant="filled"
          accessibilityLabel={t('sendToClient.message')}
          value={text}
          onChangeText={setText}
          multiline
          autoCapitalize="sentences"
        />
      )}
      <View style={styles.below}>
        <Text variant="caption" color="tertiary" numberOfLines={1} style={styles.grow}>
          {t('sendToClient.editHint')}
        </Text>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => void compose()}>
          <Text variant="caption2Strong" color="brandStrong">
            {t('sendToClient.reset')}
          </Text>
        </Pressable>
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { gap: theme.space[3.5], paddingTop: theme.space[1] },
  footer: { gap: theme.space[2] },
  client: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    padding: theme.space[3],
    borderRadius: 18,
    backgroundColor: theme.colors.bg.surface,
  },
  grow: { flex: 1, minWidth: 0 },
  channel: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.bg.canvas,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space[2],
    paddingLeft: theme.space[1],
  },
  template: {
    flexShrink: 1,
    height: 30,
    paddingLeft: theme.space[3],
    paddingRight: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1],
  },
  below: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    paddingHorizontal: theme.space[1],
  },
  pressed: { opacity: 0.7 },
}));
