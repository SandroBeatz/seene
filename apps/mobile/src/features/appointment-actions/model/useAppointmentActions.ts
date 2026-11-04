/**
 * Everything the master can do with one appointment (preview bottom bar, "⋯" menu,
 * client buttons). Status changes go through the appointment entity; destructive
 * ones ask first. Messages to the client open WhatsApp with the text prefilled —
 * the master sends them by hand until a messaging provider exists.
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Linking } from 'react-native';
import type { MessageKind } from '@/entities/message-template';
import {
  useDeleteAppointmentMutation,
  useUpdateAppointmentMutation,
  type Appointment,
  type AppointmentAction,
  type UpdateAppointmentDto,
  appointmentKeys,
} from '@/entities/appointment';
import { useUserId } from '@/entities/session';
import { phoneCallUrl, whatsappUrl } from '@/shared/lib/phone';
import { useAppointmentToast } from './useAppointmentToast';
import { useClientMessage } from './useClientMessage';
import { showFailedToast, showErrorToast, showToast, removeWithUndo } from '@/shared/ui';

export type AppointmentActionKey =
  | AppointmentAction
  | 'call'
  | 'whatsapp'
  | 'remind'
  | 'send_details'
  | 'note'
  | 'delete'
  | 'open_client';

export interface AppointmentActionContext {
  appointment: Appointment;
  /** Client's first name for messages ("Айгерим"). */
  clientFirstName: string;
  /** The client's language for messages, when known. */
  clientLanguage: string | null;
  /** Canonical phone, or empty when unknown. */
  phone: string;
  /** "сегодня, 30 октября, в 16:00" — for messages. */
  when: string;
  /** "Маникюр + дизайн, Снятие покрытия". */
  services: string;
  /** "2 500 сом". */
  price: string;
}

/**
 * `run` acts on the appointment the hook was given (the preview); `runFor` on any
 * appointment (lists: "Требуют внимания", the schedule's long-press menu).
 */
export function useAppointmentActions(bound: AppointmentActionContext | null = null) {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const update = useUpdateAppointmentMutation(userId);
  const remove = useDeleteAppointmentMutation(userId);
  const composeMessage = useClientMessage();
  const showVisitToast = useAppointmentToast();

  const failed = () => showFailedToast();
  const openFailed = () => showErrorToast(t('actions.failedTitle'));

  const patch = (ctx: AppointmentActionContext, dto: Omit<UpdateAppointmentDto, 'id'>) =>
    update.mutate({ id: ctx.appointment.id, ...dto }, { onError: failed });

  const ask = (key: string, onConfirm: () => void) =>
    Alert.alert(t(`actions.confirm.${key}.title`), t(`actions.confirm.${key}.message`), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t(`actions.confirm.${key}.action`), style: 'destructive', onPress: onConfirm },
    ]);

  const templateMessage = (ctx: AppointmentActionContext, kind: MessageKind) =>
    composeMessage({
      kind,
      clientName: ctx.clientFirstName,
      clientLanguage: ctx.clientLanguage,
      visit: {
        id: ctx.appointment.id,
        startAt: ctx.appointment.start_at,
        services: ctx.services,
        price: ctx.price,
      },
    });

  const cancelByMaster = (ctx: AppointmentActionContext) =>
    update.mutate(
      {
        id: ctx.appointment.id,
        status: 'cancelled',
        cancelled_by: 'master',
        cancelled_at: new Date().toISOString(),
      },
      {
        onError: failed,
        onSuccess: () =>
          showVisitToast({
            title: t('actions.cancelledToast'),
            summary: `${ctx.clientFirstName} · ${ctx.when}`,
            phone: ctx.phone || null,
            appointmentId: ctx.appointment.id,
            kind: 'cancellation',
          }),
      },
    );

  const openWhatsApp = (phone: string, text?: string) => {
    if (!phone) return showErrorToast(t('actions.noPhone'));
    void Linking.openURL(whatsappUrl(phone, text)).catch(openFailed);
  };

  const sendTemplate = (ctx: AppointmentActionContext, kind: MessageKind) => {
    if (!ctx.phone) return showErrorToast(t('actions.noPhone'));
    void templateMessage(ctx, kind).then((text) => {
      openWhatsApp(ctx.phone, text);
      if (kind === 'reminder') {
        showToast({
          title: t('toasts.reminderSent'),
          summary: t('toasts.reminderSummary', { name: ctx.clientFirstName }),
        });
      }
    });
  };

  function runFor(ctx: AppointmentActionContext, action: AppointmentActionKey) {
    const id = ctx.appointment.id;
    switch (action) {
      case 'confirm':
        return update.mutate(
          { id, status: 'confirmed' },
          {
            onError: failed,
            onSuccess: () =>
              showToast({
                title: t('toasts.visitConfirmed'),
                summary: `${ctx.clientFirstName} · ${ctx.when}`,
              }),
          },
        );
      case 'decline':
        return ask('decline', () => cancelByMaster(ctx));
      case 'cancel':
        return ask('cancel', () => cancelByMaster(ctx));
      case 'no_show':
        return update.mutate(
          { id, status: 'no_show' },
          {
            onError: failed,
            onSuccess: () =>
              showToast({
                title: t('toasts.noShow'),
                summary: `${ctx.clientFirstName} · ${ctx.when}`,
                tone: 'neutral',
                icon: 'noShow',
                action: {
                  label: t('toasts.undo'),
                  onPress: () => patch(ctx, { status: ctx.appointment.status }),
                },
              }),
          },
        );
      case 'delete':
        router.back();
        return removeWithUndo({
          title: t('toasts.visitDeleted'),
          summary: `${ctx.clientFirstName} · ${ctx.when}`,
          id,
          keys: [appointmentKeys.all(userId), appointmentKeys.actionable(userId)],
          commit: () => remove.mutateAsync(id),
        });
      case 'complete':
        return router.push({
          pathname: '/appointment/[appointmentId]/checkout',
          params: { appointmentId: id },
        });
      case 'reschedule':
        return router.push({
          pathname: '/appointment/[appointmentId]/reschedule',
          params: { appointmentId: id },
        });
      case 'edit':
        return router.push({
          pathname: '/appointment/[appointmentId]/services',
          params: { appointmentId: id },
        });
      case 'book_again':
        return router.push({
          pathname: '/quick-create',
          params: { clientId: ctx.appointment.client_id },
        });
      case 'note':
        return router.push({
          pathname: '/appointment/[appointmentId]/note',
          params: { appointmentId: id },
        });
      case 'call':
        if (!ctx.phone) return showErrorToast(t('actions.noPhone'));
        return void Linking.openURL(phoneCallUrl(ctx.phone)).catch(openFailed);
      case 'whatsapp':
        return openWhatsApp(ctx.phone);
      case 'remind':
        return sendTemplate(ctx, 'reminder');
      case 'send_details':
        return sendTemplate(ctx, 'confirmation');
      case 'propose_time':
        return openWhatsApp(
          ctx.phone,
          t('actions.messages.proposeTime', { name: ctx.clientFirstName, when: ctx.when }),
        );
      case 'open_client':
        return router.push({
          pathname: '/clients/[clientId]',
          params: { clientId: ctx.appointment.client_id },
        });
    }
  }

  const run = (action: AppointmentActionKey) => {
    if (bound) runFor(bound, action);
  };

  return { run, runFor, openWhatsApp, isPending: update.isPending || remove.isPending };
}
