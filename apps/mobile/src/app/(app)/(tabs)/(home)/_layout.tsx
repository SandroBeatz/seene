import { Stack } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';
import { useStackScreenOptions } from '@/shared/ui';

export const unstable_settings = { initialRouteName: 'index' };

export default function HomeStackLayout() {
  const { theme } = useUnistyles();
  return (
    <Stack screenOptions={useStackScreenOptions()}>
      <Stack.Screen
        name="index"
        // A transparent native header (avatar, greeting, analytics, notifications)
        // over the screen's hero sheet: no background, tint and status bar from the sheet.
        options={{
          title: '',
          headerTransparent: true,
          headerBackground: () => null,
          headerTintColor: theme.colors.hero.fg,
          statusBarStyle: theme.colors.hero.statusBar,
        }}
      />
    </Stack>
  );
}
