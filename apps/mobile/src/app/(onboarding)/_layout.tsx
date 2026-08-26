import { Stack } from 'expo-router';

// A single transactional wizard route. Steps are local state, not separate URLs.
export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="welcome" />
    </Stack>
  );
}
