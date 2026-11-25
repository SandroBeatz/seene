import { Stack } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';
import { useStackScreenOptions } from '@/shared/ui';

/**
 * Public authentication stack: Welcome → email → code, plus the language sheet.
 * Welcome has no header; email and code get the app's native header (transparent,
 * system back button — Liquid Glass on iOS 26 — and the back swipe), titled in content.
 */
export default function AuthLayout() {
  const { theme } = useUnistyles();
  const stackOptions = useStackScreenOptions();

  return (
    <Stack screenOptions={{ ...stackOptions, headerShown: false }}>
      <Stack.Screen name="sign-in/index" />
      <Stack.Screen name="sign-in/email" options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="sign-in/code" options={{ headerShown: true, title: '' }} />
      <Stack.Screen
        name="language"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: 'fitToContents',
          sheetCornerRadius: theme.radius.xxl,
          // The grabber is drawn in content so iOS and Android match.
          sheetGrabberVisible: false,
        }}
      />
    </Stack>
  );
}
