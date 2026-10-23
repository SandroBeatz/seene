import { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Button, FormScreen, IconButton, Input, Text } from '@/shared/ui';

export default function AppointmentFormModal() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();
  const [note, setNote] = useState('');
  const isIOS = process.env.EXPO_OS === 'ios';

  return (
    <>
      <Stack.Screen
        options={{
          title: t('navigation.appointmentForm'),
          headerLeft: isIOS
            ? undefined
            : () => (
                <IconButton
                  icon="close"
                  accessibilityLabel={t('common.close')}
                  variant="ghost"
                  onPress={() => router.dismiss()}
                />
              ),
        }}
      />
      {isIOS ? (
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button
            icon="xmark"
            accessibilityLabel={t('common.close')}
            tintColor={theme.colors.content.primary}
            variant="plain"
            onPress={() => router.dismiss()}
          />
        </Stack.Toolbar>
      ) : null}
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
