import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export const unstable_settings = { initialRouteName: 'clients/index' };

export default function ClientsStackLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen
        name="clients/index"
        options={{ title: t('tabs.clients'), headerLargeTitle: process.env.EXPO_OS === 'ios' }}
      />
      <Stack.Screen name="clients/[clientId]" options={{ title: t('navigation.clientDetails') }} />
    </Stack>
  );
}
