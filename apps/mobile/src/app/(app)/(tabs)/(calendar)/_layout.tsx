import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useStackScreenOptions } from '@/shared/ui';

export const unstable_settings = { initialRouteName: 'calendar' };

export default function CalendarStackLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={useStackScreenOptions()}>
      <Stack.Screen
        name="calendar"
        options={{ title: t('tabs.calendar'), headerLargeTitle: process.env.EXPO_OS === 'ios' }}
      />
    </Stack>
  );
}
