import { Stack } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';

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
      <Stack.Screen name="sign-in/index" options={{ headerShown: false }} />
      <Stack.Screen
        name="sign-in/email"
        options={{
          headerShown: true,
          headerShadowVisible: false,
          headerTintColor: theme.colors.content.primary,
          headerStyle: { backgroundColor: theme.colors.bg.canvas },
          presentation: isIOS ? 'modal' : 'card',
        }}
      />
      <Stack.Screen name="email" options={{ headerShown: false }} />
    </Stack>
  );
}
