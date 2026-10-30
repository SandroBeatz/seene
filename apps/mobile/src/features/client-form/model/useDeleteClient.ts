/**
 * "Удалить клиента" with its confirmation. A client with visits can't be deleted
 * (appointments and sales keep their history), and the master is told why.
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { useDeleteClientMutation, type Client } from '@/entities/client';
import { useUserId } from '@/entities/session';
import { normalizeError } from '@/shared/api/errors';

export function useDeleteClient() {
  const { t } = useTranslation();
  const remove = useDeleteClientMutation(useUserId() ?? '');

  return (client: Pick<Client, 'id' | 'first_name'>) =>
    Alert.alert(
      t('clients.form.deleteTitle'),
      t('clients.form.deleteText', { name: client.first_name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () =>
            remove.mutate(client.id, {
              onSuccess: () => router.dismissTo('/clients'),
              onError: (error) =>
                Alert.alert(
                  normalizeError(error).kind === 'has_related_records'
                    ? t('clients.form.deleteBlocked')
                    : t('actions.failedTitle'),
                ),
            }),
        },
      ],
    );
}
