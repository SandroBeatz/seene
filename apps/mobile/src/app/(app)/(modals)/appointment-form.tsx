import { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { Button, FormScreen, IconButton, Input, Text } from '@/shared/ui';

export default function AppointmentFormModal() {
  const { t } = useTranslation();
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();
  const [note, setNote] = useState('');

  return (
    <>
      <Stack.Screen
        options={{
          title: t('navigation.appointmentForm'),
          headerLeft: () => (
            <IconButton
              icon="close"
              accessibilityLabel={t('common.close')}
              variant="ghost"
              onPress={() => router.dismiss()}
            />
          ),
        }}
      />
      <FormScreen
        contentContainerStyle={styles.content}
        footer={<Button label={t('common.save')} onPress={() => router.dismiss()} fullWidth />}>
        {appointmentId ? (
          <Text variant="footnote" color="tertiary">
            {t('navigation.routeParameter', { value: appointmentId })}
          </Text>
        ) : null}
        <Input
          label={t('navigation.appointmentNote')}
          value={note}
          onChangeText={setNote}
          multiline
        />
      </FormScreen>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { gap: theme.space[4] },
}));
