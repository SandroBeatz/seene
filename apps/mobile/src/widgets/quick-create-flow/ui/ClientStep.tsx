/**
 * "Новая запись · 1 из 4: клиент" (design "AppNewClient"): the client picker under the
 * step's bar. A tap picks the client and goes on; "Новый клиент" opens the client
 * form, and the client made there goes straight on to the services.
 */
import { useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ClientPicker } from '@/features/pick-client';
import { useQuickCreateDraft } from '../model/draft.store';
import { useFlowData } from '../model/useFlowData';
import { StepChrome } from './StepChrome';

export function ClientStep() {
  const { t, draft } = useFlowData();

  // Back from "Новый клиент" with the client just made: on to the services.
  useFocusEffect(
    useCallback(() => {
      // Read outside React state: the flag is consumed once.
      if (useQuickCreateDraft.getState().consumeAdvance()) router.push('/quick-create/services');
    }, []),
  );

  return (
    <View style={styles.root} collapsable={false}>
      <StepChrome step={1} subtitle={t('quickCreate.client.subtitle')} client={null} />
      <ClientPicker
        onPick={(client) => {
          draft.setClient(client.id);
          router.push('/quick-create/services');
        }}
        onNew={() => router.push({ pathname: '/client/new', params: { for: 'appointment' } })}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
}));
