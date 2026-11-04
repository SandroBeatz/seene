/**
 * The toast after a visit is created, moved or cancelled (design "Тосты · записи"): what
 * happened, who and when, and "Отправить клиенту" — WhatsApp with the details. No number to
 * write to: it only confirms.
 */
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';
import { whatsappUrl } from '@/shared/lib/phone';
import { showErrorToast, showToast } from '@/shared/ui';

export interface AppointmentToastData {
  /** "Запись создана" / "Запись перенесена" / "Запись отменена". */
  title: string;
  /** "Айгерим · пт 31 окт, 11:00–13:00". */
  summary: string;
  /** Canonical digits for WhatsApp; null when the client has no number. */
  phone: string | null;
  /** The text for the client, made when the master sends it: it may mint a personal link. */
  message: () => Promise<string>;
}

export function useAppointmentToast() {
  const { t } = useTranslation();

  return ({ title, summary, phone, message }: AppointmentToastData) => {
    showToast({
      title,
      summary,
      cta: phone
        ? {
            label: t('actions.sendToClient'),
            icon: 'whatsapp',
            onPress: () => {
              void message()
                .then((text) => Linking.openURL(whatsappUrl(phone, text)))
                .catch(() => showErrorToast(t('actions.failedTitle')));
            },
          }
        : undefined,
    });
  };
}
