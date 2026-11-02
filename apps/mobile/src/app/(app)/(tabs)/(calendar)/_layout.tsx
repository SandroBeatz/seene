import { Stack } from 'expo-router';
import { useStackScreenOptions } from '@/shared/ui';

export const unstable_settings = { initialRouteName: 'calendar' };

export default function CalendarStackLayout() {
  return (
    <Stack screenOptions={useStackScreenOptions()}>
      {/* No title: the screens draw the month in this header. */}
      <Stack.Screen name="calendar" options={{ title: '' }} />
      <Stack.Screen
        name="calendar-day"
        options={{ title: '', headerBackButtonDisplayMode: 'default' }}
      />
    </Stack>
  );
}
