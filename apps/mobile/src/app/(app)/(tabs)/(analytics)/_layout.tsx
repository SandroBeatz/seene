import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export const unstable_settings = { initialRouteName: 'analytics' };

export default function AnalyticsStackLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen
        name="analytics"
        options={{ title: t('tabs.analytics'), headerLargeTitle: process.env.EXPO_OS === 'ios' }}
      />
    </Stack>
  );
}
