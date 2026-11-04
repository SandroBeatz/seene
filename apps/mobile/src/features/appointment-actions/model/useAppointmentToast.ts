/**
 * The toast after a visit is created, moved or cancelled (design "Тосты · записи"): what
 * happened, who and when, and "Отправить клиенту", which opens the send sheet. No number to
 * write to: it only confirms.
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { MessageKind } from '@/entities/message-template';
import { showToast } from '@/shared/ui';

export interface AppointmentToastData {
  /** "Запись создана" / "Запись перенесена" / "Запись отменена". */
  title: string;
  /** "Айгерим · пт 31 окт, 11:00–13:00". */
  summary: string;
  /** Null when the client has no number. */
  phone: string | null;
  appointmentId: string;
  /** The template the sheet opens with. */
  kind: Extract<MessageKind, 'confirmation' | 'reschedule' | 'cancellation'>;
}

export function useAppointmentToast() {
  const { t } = useTranslation();

  return ({ title, summary, phone, appointmentId, kind }: AppointmentToastData) => {
    showToast({
      title,
      summary,
      cta: phone
        ? {
            label: t('actions.sendToClient'),
            icon: 'whatsapp',
            onPress: () =>
              router.push({
                pathname: '/appointment/[appointmentId]/send',
                params: { appointmentId, kind, event: title },
              }),
          }
        : undefined,
    });
  };
}
