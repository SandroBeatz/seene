/**
 * Another client for a visit (a tap on the client in the preview): the client picker
 * with the current one checked. A pick — or a client just made in "Новый клиент" —
 * moves the visit to them and closes.
 */
import { useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useUpdateAppointmentMutation, type Appointment } from '@/entities/appointment';
import { useUserId } from '@/entities/session';
import { ClientPicker } from '@/features/pick-client';
import { SheetChrome } from '@/shared/ui';
import { useClientHandoff } from '../model/client-handoff.store';

export interface ChangeClientSheetProps {
  appointment: Appointment;
}

export function ChangeClientSheet({ appointment }: ChangeClientSheetProps) {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const update = useUpdateAppointmentMutation(userId);
  const { mutate } = update;

  const choose = useCallback(
    (clientId: string) => {
      if (clientId === appointment.client_id) return router.back();
      mutate(
        { id: appointment.id, client_id: clientId },
        {
          onSuccess: () => router.back(),
          onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
        },
      );
    },
    [appointment.id, appointment.client_id, mutate, t],
  );

  // Back from "Новый клиент" with the client just made: that's the pick.
  useFocusEffect(
    useCallback(() => {
      // Read outside React state: the id is taken once.
      const made = useClientHandoff.getState().take();
      if (made) choose(made);
    }, [choose]),
  );

  return (
    <View style={styles.root} collapsable={false}>
      <SheetChrome title={t('preview.changeClient')} leadingLabel={t('common.close')} spacer />
      <ClientPicker
        selectedId={appointment.client_id}
        onPick={(client) => choose(client.id)}
        onNew={() =>
          router.push({ pathname: '/client/new', params: { for: 'appointment-client' } })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
}));
