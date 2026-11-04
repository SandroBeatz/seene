/** "Изменения сохранены · Запись Айгерим, пт 31 окт": after a visit is edited in place. */
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import type { Appointment } from '@/entities/appointment';
import { useClientsQuery } from '@/entities/client';
import { useMoneyContext } from '@/entities/master';
import { useUserId } from '@/entities/session';
import { showToast } from '@/shared/ui';

export function useVisitSavedToast(appointment: Pick<Appointment, 'client_id' | 'start_at'>) {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const clients = useClientsQuery(userId);
  const { zone } = useMoneyContext(userId);

  return (clientId = appointment.client_id) => {
    const weekdays = t('weekdays.short', { returnObjects: true }) as string[];
    const months = t('monthsShort', { returnObjects: true }) as string[];
    const local = DateTime.fromISO(appointment.start_at, { zone: 'utc' }).setZone(zone);
    const name = clients.data?.find((client) => client.id === clientId)?.first_name;
    const day =
      `${weekdays[local.weekday - 1]} ${local.day} ${months[local.month - 1]}`.toLocaleLowerCase();
    showToast({
      title: t('toasts.saved'),
      summary: name ? t('toasts.visitSummary', { name, day }) : day,
    });
  };
}
