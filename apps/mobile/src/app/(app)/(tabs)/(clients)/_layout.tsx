import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useStackScreenOptions } from '@/shared/ui';

export const unstable_settings = { initialRouteName: 'clients/index' };

export default function ClientsStackLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={useStackScreenOptions()}>
      <Stack.Screen
        name="clients/index"
        // The list adds its "add" button and search bar to this header.
        options={{ title: t('tabs.clients'), headerLargeTitle: process.env.EXPO_OS === 'ios' }}
      />
    </Stack>
  );
}
