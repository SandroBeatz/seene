import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export const unstable_settings = { initialRouteName: 'index' };

export default function QuickCreateLayout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ title: t('quickCreate.startTitle') }} />
      <Stack.Screen name="client" options={{ title: t('quickCreate.clientTitle') }} />
      <Stack.Screen name="services" options={{ title: t('quickCreate.servicesTitle') }} />
      <Stack.Screen name="date-time" options={{ title: t('quickCreate.dateTimeTitle') }} />
      <Stack.Screen name="review" options={{ title: t('quickCreate.reviewTitle') }} />
    </Stack>
  );
}
