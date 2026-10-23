import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ServiceList } from '@/widgets/service-list';

export default function ServicesScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t('services.title') }} />
      <ServiceList />
    </>
  );
}
