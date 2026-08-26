import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useUnistyles } from 'react-native-unistyles';
import { NavigationHeaderBackground } from '@/shared/ui/NavigationHeaderBackground';

/** Protected application stack: tabs are the base, route modals are siblings. */
export default function AppLayout() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerTransparent: process.env.EXPO_OS === 'ios',
        headerShadowVisible: false,
        headerTintColor: theme.colors.content.primary,
        headerBackground: () => <NavigationHeaderBackground />,
        statusBarStyle: theme.name === 'dark' ? 'light' : 'dark',
        contentStyle: { backgroundColor: theme.colors.bg.canvas },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(modals)/appointment-form"
        options={{ presentation: 'modal', title: t('navigation.appointmentForm') }}
      />
      <Stack.Screen
        name="(modals)/checkout/[appointmentId]"
        options={{
          presentation: 'formSheet',
          headerShown: false,
          sheetAllowedDetents: [0.45, 0.85],
          sheetInitialDetentIndex: 0,
          sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen
        name="(modals)/quick-create"
        options={{ presentation: 'fullScreenModal', headerShown: false }}
      />
    </Stack>
  );
}
