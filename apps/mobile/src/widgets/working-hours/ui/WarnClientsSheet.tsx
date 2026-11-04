/**
 * "Написать клиентам" (design AppSendDayOff): a vacation or a day off fell on these visits, and
 * each client gets their own text, one WhatsApp chat at a time. wa.me can't report delivery, so
 * coming back from WhatsApp counts as sent, and the next client opens.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  appointmentTotalPrice,
  useAppointmentsRangeQuery,
  type Appointment,
} from '@/entities/appointment';
import { clientName, useClientsQuery, type Client } from '@/entities/client';
import { useMoneyContext } from '@/entities/master';
import { useServicesQuery } from '@/entities/service';
import { useClientMessage } from '@/features/appointment-actions';
import { useTimeContext } from '@/features/pick-time';
import { isSupportedLocale, pluralCategory } from '@/shared/lib/i18n';
import { whatsappUrl } from '@/shared/lib/phone';
import {
  Avatar,
  Button,
  FormScreen,
  Icon,
  Input,
  SheetChrome,
  Text,
  showErrorToast,
} from '@/shared/ui';
import { isAffectedVisit } from '../lib/visits';

export function WarnClientsSheet() {
  const { t, i18n } = useTranslation();
  const { from, to, label, period } = useLocalSearchParams<{
    from: string;
    to: string;
    /** "Отпуск 22 – 29 декабря". */
    label: string;
    /** "с 22 по 29 декабря": for the message. */
    period: string;
  }>();
  const ctx = useTimeContext();
  const { money } = useMoneyContext(ctx.userId);
  const visits = useAppointmentsRangeQuery(ctx.userId, from, to);
  const clients = useClientsQuery(ctx.userId);
  const services = useServicesQuery(ctx.userId);
  const composeMessage = useClientMessage();

  const [now] = useState(() => new Date());
  const affected = (visits.data ?? []).filter((visit) => isAffectedVisit(visit, now));
  const clientOf = (visit: Appointment) =>
    clients.data?.find((client) => client.id === visit.client_id);
  const namesOf = (visit: Appointment) =>
    visit.service_ids.flatMap((id) => services.data?.find((s) => s.id === id) ?? []);

  const [texts, setTexts] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<ReadonlySet<string>>(new Set());
  // Undefined: the next client not written to yet. Null: all closed by hand.
  const [opened, setOpened] = useState<string | null | undefined>(undefined);
  const waitingFor = useRef<string | null>(null);

  const compose = (visit: Appointment, client: Client) => {
    const picked = namesOf(visit);
    return composeMessage({
      kind: 'day_off',
      clientName: client.first_name,
      clientLanguage: client.language,
      offPeriod: period,
      visit: {
        id: visit.id,
        startAt: visit.start_at,
        services: picked.map((s) => s.name).join(', '),
        price: money(appointmentTotalPrice(visit, picked)),
      },
    }).then((text) => setTexts((all) => ({ ...all, [visit.id]: text })));
  };

  const ready = !!visits.data && !!clients.data && !!services.data;
  useEffect(() => {
    if (!ready) return;
    for (const visit of affected) {
      const client = clientOf(visit);
      if (client) void compose(visit, client);
    }
    // Once the data is here: later on the texts are the master's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Back from WhatsApp: that one is done, and the next client opens.
  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      const id = waitingFor.current;
      if (state !== 'active' || !id) return;
      waitingFor.current = null;
      setSent((done) => new Set(done).add(id));
      setOpened(undefined);
    });
    return () => listener.remove();
  }, []);

  const open = opened === undefined ? affected.find((v) => !sent.has(v.id))?.id : opened;

  const send = (visit: Appointment, client: Client) => {
    const phone = client.whatsapp ?? client.phone;
    if (!phone) return showErrorToast(t('actions.noPhone'));
    waitingFor.current = visit.id;
    Linking.openURL(whatsappUrl(phone, texts[visit.id] ?? '')).catch(() => {
      waitingFor.current = null;
      showErrorToast(t('actions.failedTitle'));
    });
  };

  const count = affected.length;
  const subtitle = `${label} · ${t(`sendToClient.visits_${pluralCategory(count, isSupportedLocale(i18n.language) ? i18n.language : 'en')}`, { count })}`;

  return (
    <FormScreen
      edges={['left', 'right', 'bottom']}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      footer={
        <View style={styles.footer}>
          <Text variant="caption" color="tertiary" align="center">
            {t('sendToClient.oneByOne')}
          </Text>
          <Text variant="footnoteStrong" align="center" tabularNums>
            {t('sendToClient.progress', { done: sent.size, count })}
          </Text>
          <Button label={t('common.done')} onPress={() => router.back()} fullWidth />
        </View>
      }>
      <SheetChrome title={t('menuHome.hours.warnTitle')} leadingLabel={t('common.close')} />
      <Text variant="caption" color="tertiary" tabularNums align="center" numberOfLines={1}>
        {subtitle}
      </Text>

      <View style={styles.templateRow}>
        <Text variant="caption" color="secondary">
          {t('sendToClient.template')}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/settings/messages')}
          style={({ pressed }) => [styles.template, pressed && styles.pressed]}>
          <Text variant="footnoteStrong" numberOfLines={1}>
            {t('menuHome.messages.kinds.day_off.title')}
          </Text>
          <Icon name="chevronRight" size={14} color="content.secondary" />
        </Pressable>
      </View>

      {affected.map((visit) => {
        const client = clientOf(visit);
        if (!client) return null;
        const name = clientName(client);
        const isOpen = open === visit.id;
        const isSent = sent.has(visit.id);
        const when = `${ctx.dayLabel(ctx.dayKeyOf(visit.start_at))}, ${ctx.time(visit.start_at)}`;
        const what = namesOf(visit)
          .map((s) => s.name)
          .join(', ');
        return (
          <View key={visit.id} style={styles.card}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              onPress={() => setOpened(isOpen ? null : visit.id)}
              style={styles.row}>
              <Avatar name={name} color={client.avatar_color} size="md" />
              <View style={styles.grow}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {name}
                </Text>
                <Text variant="caption" color="tertiary" tabularNums numberOfLines={1}>
                  {what ? `${when} · ${what}` : when}
                </Text>
              </View>
              {isSent ? (
                <View style={styles.sent}>
                  <Icon name="check" size={12} color="tone.success.fg" />
                  <Text variant="caption2Strong" style={styles.sentText}>
                    {t('sendToClient.sent')}
                  </Text>
                </View>
              ) : null}
              <View style={isOpen ? styles.flipped : undefined}>
                <Icon name="chevronDown" size={16} color="content.tertiary" />
              </View>
            </Pressable>
            {isOpen ? (
              <View style={styles.body}>
                <Input
                  accessibilityLabel={t('sendToClient.messageTo', { name })}
                  value={texts[visit.id] ?? ''}
                  onChangeText={(text) => setTexts((all) => ({ ...all, [visit.id]: text }))}
                  multiline
                  autoCapitalize="sentences"
                />
                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={8}
                    style={styles.grow}
                    onPress={() => void compose(visit, client)}>
                    <Text variant="caption2Strong" color="brandStrong">
                      {t('sendToClient.reset')}
                    </Text>
                  </Pressable>
                  <Button
                    label={t(isSent ? 'sendToClient.sendAgain' : 'sendToClient.sendShort')}
                    leftIcon="whatsapp"
                    size="sm"
                    disabled={!texts[visit.id]?.trim()}
                    onPress={() => send(visit, client)}
                  />
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { gap: theme.space[2.5], paddingTop: theme.space[1] },
  footer: { gap: theme.space[2] },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space[2],
    paddingHorizontal: theme.space[1],
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
  card: { borderRadius: 18, overflow: 'hidden', backgroundColor: theme.colors.bg.surface },
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingHorizontal: theme.space[3.5],
    paddingVertical: 10,
  },
  grow: { flex: 1, minWidth: 0 },
  sent: {
    height: 24,
    paddingHorizontal: 9,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1],
    backgroundColor: theme.colors.tone.success.bg,
  },
  sentText: { color: theme.colors.tone.success.fg },
  body: {
    paddingHorizontal: theme.space[3.5],
    paddingBottom: theme.space[3.5],
    gap: theme.space[2],
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  flipped: { transform: [{ rotate: '180deg' }] },
  pressed: { opacity: 0.7 },
}));
