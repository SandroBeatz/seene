/**
 * What "Сегодня" does when the master acts on an attention card or a schedule visit:
 * appointment actions go through `appointment-actions`; closing ("Понятно"),
 * snoozing ("Позже") and sent reminders are stored as dismissals, so the card
 * leaves on every device.
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Linking } from 'react-native';
import { useDismissAttentionMutation } from '@/entities/attention';
import { useUserId } from '@/entities/session';
import {
  useClientMessage,
  useVisitActions,
  type ScheduleMenuAction,
} from '@/features/appointment-actions';
import type { AppLocale } from '@/shared/lib/i18n';
import { phoneCallUrl } from '@/shared/lib/phone';
import { reminderKey, type AttentionAction, type AttentionMenuAction } from './attention';
import type { AttentionCard, AttentionVisit } from './useAttention';

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
  const actions = useVisitActions(input);
  const composeMessage = useClientMessage();
  const dismissMutation = useDismissAttentionMutation(userId);

  const dismiss = (key: string, until: string | null) =>
    dismissMutation.mutate([{ key, until }], {
      onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
    });
  const inDays = (days: number) => new Date(input.now + days * DAY_MS).toISOString();
  const run = actions.run;

  const invite = (card: AttentionCard) => {
    if (card.kind !== 'recall' || !card.client) return;
    const { client } = card;
    void composeMessage({
      kind: 'recall',
      clientName: client.first_name,
      clientLanguage: client.language,
    }).then((text) => actions.openWhatsApp(client.phone ?? '', text));
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
