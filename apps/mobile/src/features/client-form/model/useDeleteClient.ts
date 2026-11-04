/**
 * "Удалить клиента", with "Отменить" on the toast. A client with visits can't be deleted
 * (appointments and sales keep their history): the master is told so before anything happens.
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { countClientAppointments } from '@/entities/appointment';
import { clientKeys, useDeleteClientMutation, type Client } from '@/entities/client';
import { useUserId } from '@/entities/session';
import { normalizeError } from '@/shared/api/errors';
import { removeWithUndo, showFailedToast } from '@/shared/ui';

export function useDeleteClient() {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const remove = useDeleteClientMutation(userId);

  return async (client: Pick<Client, 'id' | 'first_name' | 'last_name'>) => {
    let visits: number;
    try {
      visits = await countClientAppointments(userId, client.id);
    } catch {
      return showFailedToast();
    }
    if (visits > 0) return Alert.alert(t('clients.form.deleteBlocked'));
    router.dismissTo('/clients');
    removeWithUndo({
      title: t('toasts.clientDeleted'),
      summary: [client.first_name, client.last_name].filter(Boolean).join(' '),
      id: client.id,
      keys: [clientKeys.all(userId)],
      commit: () => remove.mutateAsync(client.id),
      // A visit booked online in those five seconds.
      onFailed: (error) => {
        if (normalizeError(error).kind !== 'has_related_records') return false;
        Alert.alert(t('clients.form.deleteBlocked'));
        return true;
      },
    });
  };
}
