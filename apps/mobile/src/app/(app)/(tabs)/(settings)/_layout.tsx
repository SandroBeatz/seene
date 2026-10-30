import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useStackScreenOptions } from '@/shared/ui';

export const unstable_settings = { initialRouteName: 'settings/index' };

export default function SettingsStackLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={useStackScreenOptions()}>
      <Stack.Screen
        name="settings/index"
        options={{ title: t('tabs.menu'), headerLargeTitle: process.env.EXPO_OS === 'ios' }}
      />
    </Stack>
  );
}
