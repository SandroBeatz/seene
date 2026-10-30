/**
 * What "Сегодня" does when the master acts on an attention card or a schedule visit:
 * appointment actions go through `appointment-actions`; closing ("Понятно"),
 * snoozing ("Позже") and sent reminders are stored as dismissals, so the card
 * leaves on every device.
 */
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { Alert, Linking } from 'react-native';
import { useDismissAttentionMutation } from '@/entities/attention';
import { useUserId } from '@/entities/session';
import {
  useAppointmentActions,
  type AppointmentActionContext,
  type AppointmentActionKey,
} from '@/features/appointment-actions';
import { formatAmount, formatTime } from '@/shared/lib/formats';
import type { AppLocale } from '@/shared/lib/i18n';
import { phoneCallUrl } from '@/shared/lib/phone';
import { reminderKey, type AttentionAction, type AttentionMenuAction } from './attention';
import type { AttentionCard, AttentionVisit } from './useAttention';
import type { ScheduleMenuAction } from './schedule-menu';

const DAY_MS = 86_400_000;
/** "Позже" on "Пора позвать". */
const SNOOZE_DAYS = 7;
/** After an invite: give the client time to answer before asking again. */
const INVITED_DAYS = 14;

export interface TodayActionsInput {
  zone: string;
  todayKey: string;
  timeFormat: 12 | 24;
  currency: string;
  locale: AppLocale;
  now: number;
  /** End of tomorrow (UTC ISO). */
  tomorrowEnd: string;
}

export function useTodayActions(input: TodayActionsInput) {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const actions = useAppointmentActions();
  const dismissMutation = useDismissAttentionMutation(userId);

  const dismiss = (key: string, until: string | null) =>
    dismissMutation.mutate([{ key, until }], {
      onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
    });
  const inDays = (days: number) => new Date(input.now + days * DAY_MS).toISOString();

  /** The message context of a visit ("сегодня, в 16:00", "Маникюр", "2 400 сом"). */
  const contextOf = (visit: AttentionVisit): AppointmentActionContext => {
    const local = DateTime.fromISO(visit.appointment.start_at, { zone: 'utc' })
      .setZone(input.zone)
      .setLocale(input.locale);
    const days = Math.round(
      local.startOf('day').diff(DateTime.fromISO(input.todayKey, { zone: input.zone }), 'days')
        .days,
    );
    const date =
      days === 0
        ? t('preview.day.today')
        : days === 1
          ? t('preview.day.tomorrow')
          : local.toFormat('d MMMM');
    return {
      appointment: visit.appointment,
      clientFirstName: visit.client?.first_name ?? '',
      phone: visit.client?.phone ?? '',
      when: t('preview.when', {
        date: date.toLocaleLowerCase(input.locale),
        time: formatTime(visit.appointment.start_at, {
          zone: input.zone,
          timeFormat: input.timeFormat,
        }),
      }),
      services: visit.serviceNames.join(', '),
      price: formatAmount(visit.price, { currency: input.currency, locale: input.locale }),
    };
  };

  const run = (visit: AttentionVisit | null, action: AppointmentActionKey) => {
    if (visit) actions.runFor(contextOf(visit), action);
  };

  const invite = (card: AttentionCard) => {
    if (card.kind !== 'recall' || !card.client) return;
    actions.openWhatsApp(
      card.client.phone ?? '',
      t('today.attention.recallMessage', { name: card.client.first_name }),
    );
    dismiss(card.key, inDays(INVITED_DAYS));
  };

  const call = (phone: string | null | undefined) => {
    if (!phone) return Alert.alert(t('actions.noPhone'));
    void Linking.openURL(phoneCallUrl(phone));
  };

  const openClient = (clientId: string) =>
    router.push({ pathname: '/clients/[clientId]', params: { clientId } });

  /** A card's round button. */
  function cardAction(card: AttentionCard, action: AttentionAction) {
    switch (action) {
      case 'message':
        return run(card.visit, 'whatsapp');
      case 'dismiss':
        return dismiss(card.key, null);
      case 'snooze':
        return dismiss(card.key, inDays(SNOOZE_DAYS));
      case 'invite':
        return invite(card);
      case 'send_reminders': {
        // WhatsApp opens one chat at a time: send to the next client, the card counts down.
        if (!card.visit) return;
        run(card.visit, 'remind');
        // Kept a day past the visit so it never comes back while it matters.
        const until = new Date(Date.parse(input.tomorrowEnd) + DAY_MS).toISOString();
        return dismiss(reminderKey(card.visit.appointment.id), until);
      }
      default:
        return run(card.visit, action);
    }
  }

  /** A tap on the card. */
  function openCard(card: AttentionCard) {
    if (card.kind === 'recall') return openClient(card.clientId);
    if (card.kind === 'tomorrow_reminders') return cardAction(card, 'send_reminders');
    if (card.visit) {
      router.push({
        pathname: '/appointment/[appointmentId]',
        params: { appointmentId: card.visit.appointment.id },
      });
    }
  }

  /** An item of a card's long-press menu. */
  function cardMenu(card: AttentionCard, action: AttentionMenuAction) {
    if (card.kind === 'recall') {
      if (action === 'invite') return invite(card);
      if (action === 'snooze') return cardAction(card, 'snooze');
      if (action === 'call') return call(card.client?.phone);
      if (action === 'open_client') return openClient(card.clientId);
      return;
    }
    if (action === 'dismiss') return dismiss(card.key, null);
    if (action === 'invite' || action === 'snooze') return;
    run(card.visit, action);
  }

  /** An item of a schedule visit's long-press menu. */
  const scheduleMenu = (visit: AttentionVisit, action: ScheduleMenuAction) => run(visit, action);

  return { cardAction, openCard, cardMenu, scheduleMenu };
}
