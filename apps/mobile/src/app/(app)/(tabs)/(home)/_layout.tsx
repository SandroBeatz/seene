import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export const unstable_settings = { initialRouteName: 'index' };

export default function HomeStackLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen
        name="index"
        options={{ title: t('tabs.home'), headerLargeTitle: process.env.EXPO_OS === 'ios' }}
      />
    </Stack>
  );
}
