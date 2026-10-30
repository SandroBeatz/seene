import { Stack } from 'expo-router';
import { useStackScreenOptions } from '@/shared/ui';

export const unstable_settings = { initialRouteName: 'index' };

export default function HomeStackLayout() {
  return (
    <Stack screenOptions={useStackScreenOptions()}>
      <Stack.Screen
        name="index"
        // No title: "Сегодня" heads the content; the screen puts the avatar, the
        // greeting and analytics into this header.
        options={{ title: '' }}
      />
    </Stack>
  );
}
