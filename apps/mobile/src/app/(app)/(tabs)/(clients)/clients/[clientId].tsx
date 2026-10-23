import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ClientDetails } from '@/widgets/client-details';

export default function ClientDetailsScreen() {
  const { t } = useTranslation();
  const { clientId } = useLocalSearchParams<{ clientId: string }>();

  return (
    <>
      <Stack.Screen options={{ title: t('navigation.clientDetails') }} />
      <ClientDetails clientId={clientId} />
    </>
  );
}
