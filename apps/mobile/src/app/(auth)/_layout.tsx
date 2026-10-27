import { Stack } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';

/**
 * Public authentication stack: Welcome → email → code, plus the language sheet.
 * Every step draws its own back button, so no native headers here.
 */
export default function AuthLayout() {
  const { theme } = useUnistyles();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        statusBarStyle: theme.name === 'dark' ? 'light' : 'dark',
        contentStyle: { backgroundColor: theme.colors.bg.canvas },
      }}>
      <Stack.Screen name="sign-in/index" />
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
