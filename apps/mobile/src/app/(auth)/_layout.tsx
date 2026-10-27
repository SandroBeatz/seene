import { Stack } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';
import { NavigationHeaderBackground } from '@/shared/ui/NavigationHeaderBackground';

/** Public authentication stack. Canonical URLs live under `/sign-in`. */
export default function AuthLayout() {
  const { theme } = useUnistyles();
  const isIOS = process.env.EXPO_OS === 'ios';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg.canvas },
      }}>
      <Stack.Screen
        name="sign-in/index"
        options={{ headerShown: false, statusBarStyle: theme.name === 'dark' ? 'light' : 'dark' }}
      />
      <Stack.Screen
        name="language"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: 'fitToContents',
          sheetCornerRadius: theme.radius.xxl,
          // The grabber is drawn in content so iOS and Android match.
          sheetGrabberVisible: false,
          contentStyle: { backgroundColor: theme.colors.bg.canvas },
        }}
      />
      <Stack.Screen
        name="sign-in/email"
        options={{
          headerShown: true,
          headerTransparent: isIOS,
          headerShadowVisible: false,
          headerTintColor: theme.colors.content.primary,
          headerBackground: () => <NavigationHeaderBackground />,
          statusBarStyle: theme.name === 'dark' ? 'light' : 'dark',
          presentation: isIOS ? 'modal' : 'card',
        }}
      />
      <Stack.Screen name="email" options={{ headerShown: false }} />
    </Stack>
  );
}
