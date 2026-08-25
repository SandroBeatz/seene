import { Stack } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';

/**
 * Auth group. `index` is the landing screen (logo + social buttons). `email` is the
 * email login form: an iOS page-sheet modal that stops short of the top, or a pushed
 * page on Android. The native header is hidden — the screen draws its own overlay
 * header (AuthModalHeader) so it can use a gradient scrim + scroll-driven title.
 */
export default function AuthLayout() {
  const { theme } = useUnistyles();
  const isIOS = process.env.EXPO_OS === 'ios';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg.canvas },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="email"
        options={{
          // A real Stack header, rendered custom via <Stack.Header asChild> in the
          // screen so it can carry a gradient. Transparent → content scrolls under it.
          headerShown: true,
          headerTransparent: true,
          // iOS: page sheet (leaves a gap at the top). Android: standard push.
          presentation: isIOS ? 'modal' : 'card',
        }}
      />
    </Stack>
  );
}
