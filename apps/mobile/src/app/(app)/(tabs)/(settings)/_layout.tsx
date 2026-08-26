import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export const unstable_settings = { initialRouteName: 'settings/index' };

export default function SettingsStackLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen
        name="settings/index"
        options={{ title: t('tabs.settings'), headerLargeTitle: process.env.EXPO_OS === 'ios' }}
      />
      <Stack.Screen name="settings/profile" options={{ title: t('navigation.profileSettings') }} />
    </Stack>
  );
}
