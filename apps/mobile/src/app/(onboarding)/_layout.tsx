import { Stack } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';

/**
 * Onboarding: one route per step, pushed left to right. Each step draws its own
 * header (back + progress), so native headers are off. The draft lives in a
 * persisted store, not in the route.
 */
export default function OnboardingLayout() {
  const { theme } = useUnistyles();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        statusBarStyle: theme.name === 'dark' ? 'light' : 'dark',
        contentStyle: { backgroundColor: theme.colors.bg.canvas },
      }}>
      <Stack.Screen name="onboarding/index" />
      <Stack.Screen name="onboarding/profile" />
      <Stack.Screen name="onboarding/professions" />
      <Stack.Screen name="welcome" />
    </Stack>
  );
}
