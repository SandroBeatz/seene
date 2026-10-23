import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Card, FormSheetContent, IconButton, Text } from '@/shared/ui';

export default function CheckoutFormSheet() {
  const { t } = useTranslation();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();

  return (
    <FormSheetContent
      title={t('navigation.checkout')}
      description={t('navigation.formSheetDescription')}
      headerLeft={
        <IconButton
          icon="close"
          accessibilityLabel={t('common.close')}
          variant="ghost"
          onPress={() => router.dismiss()}
        />
      }
      footer={<Button label={t('common.confirm')} onPress={() => router.dismiss()} fullWidth />}>
      <Card style={styles.card}>
        <Text variant="body">{t('navigation.routeParameter', { value: appointmentId })}</Text>
        <Text variant="subhead" color="secondary">
          {t('placeholders.checkout')}
        </Text>
      </Card>
    </FormSheetContent>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: { gap: theme.space[2] },
}));
