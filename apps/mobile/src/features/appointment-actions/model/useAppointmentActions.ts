/**
 * Everything the master can do with one appointment (preview bottom bar, "⋯" menu,
 * client buttons). Status changes go through the appointment entity; destructive
 * ones ask first. Messages to the client open WhatsApp with the text prefilled —
 * the master sends them by hand until a messaging provider exists.
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Linking } from 'react-native';
import {
  useDeleteAppointmentMutation,
  useUpdateAppointmentMutation,
  type Appointment,
  type AppointmentAction,
  type UpdateAppointmentDto,
} from '@/entities/appointment';
import { useUserId } from '@/entities/session';
import { phoneCallUrl, whatsappUrl } from '@/shared/lib/phone';

export type AppointmentActionKey =
  AppointmentAction | 'call' | 'whatsapp' | 'remind' | 'send_details' | 'note' | 'delete';

export interface AppointmentActionContext {
  appointment: Appointment;
  /** Client's first name for messages ("Айгерим"). */
  clientFirstName: string;
  /** Canonical phone, or empty when unknown. */
  phone: string;
  /** "сегодня, 30 октября, в 16:00" — for messages. */
  when: string;
  /** "Маникюр + дизайн, Снятие покрытия". */
  services: string;
  /** "2 500 сом". */
  price: string;
}

export function useAppointmentActions(ctx: AppointmentActionContext | null) {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const update = useUpdateAppointmentMutation(userId);
  const remove = useDeleteAppointmentMutation(userId);

  const failed = () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage'));

  const patch = (dto: Omit<UpdateAppointmentDto, 'id'>) => {
    if (!ctx) return;
    update.mutate({ id: ctx.appointment.id, ...dto }, { onError: failed });
  };

  const ask = (key: string, onConfirm: () => void) =>
    Alert.alert(t(`actions.confirm.${key}.title`), t(`actions.confirm.${key}.message`), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t(`actions.confirm.${key}.action`), style: 'destructive', onPress: onConfirm },
    ]);

  const cancelByMaster = () =>
    patch({ status: 'cancelled', cancelled_by: 'master', cancelled_at: new Date().toISOString() });

  const openWhatsApp = (text?: string) => {
    if (!ctx?.phone) return Alert.alert(t('actions.noPhone'));
    void Linking.openURL(whatsappUrl(ctx.phone, text)).catch(failed);
  };

  const message = (key: string) =>
    ctx
      ? t(`actions.messages.${key}`, {
          name: ctx.clientFirstName,
          when: ctx.when,
          services: ctx.services,
          price: ctx.price,
        })
      : '';

  function run(action: AppointmentActionKey) {
    if (!ctx) return;
    const id = ctx.appointment.id;
    switch (action) {
      case 'confirm':
        return patch({ status: 'confirmed' });
      case 'decline':
        return ask('decline', cancelByMaster);
      case 'cancel':
        return ask('cancel', cancelByMaster);
      case 'no_show':
        return ask('noShow', () => patch({ status: 'no_show' }));
      case 'delete':
        return ask('delete', () =>
          remove.mutate(id, {
            onSuccess: () => router.back(),
            onError: failed,
          }),
        );
      case 'complete':
        return router.push({
          pathname: '/checkout/[appointmentId]',
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
        if (!ctx.phone) return Alert.alert(t('actions.noPhone'));
        return void Linking.openURL(phoneCallUrl(ctx.phone)).catch(failed);
      case 'whatsapp':
        return openWhatsApp();
      case 'remind':
        return openWhatsApp(message('reminder'));
      case 'send_details':
        return openWhatsApp(message('details'));
      case 'propose_time':
        return openWhatsApp(message('proposeTime'));
    }
  }

  return { run, isPending: update.isPending || remove.isPending };
}
