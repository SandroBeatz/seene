import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Card, ScreenScrollView, Text } from '@/shared/ui';

export default function AppointmentDetailsScreen() {
  const { t } = useTranslation();
  const { appointmentId, source } = useLocalSearchParams<{
    appointmentId: string;
    source?: string;
  }>();

  return (
    <>
      <Stack.Screen options={{ title: t('navigation.appointmentDetails') }} />
      <ScreenScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text variant="title3">{t('navigation.sharedRoute')}</Text>
          <Text variant="body" color="secondary">
            {t('navigation.routeParameter', { value: appointmentId })}
          </Text>
          {source ? (
            <Text variant="footnote" color="tertiary">
              {t('navigation.openedFrom', { source })}
            </Text>
          ) : null}
        </Card>

        <Button
          label={t('navigation.editInModal')}
          variant="secondary"
          onPress={() => router.push({ pathname: '/appointment-form', params: { appointmentId } })}
          fullWidth
        />
        <Button
          label={t('navigation.openCheckout')}
          onPress={() =>
            router.push({ pathname: '/checkout/[appointmentId]', params: { appointmentId } })
          }
          fullWidth
        />
      </ScreenScrollView>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { gap: theme.space[4] },
}));
