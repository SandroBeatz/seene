import { Stack } from 'expo-router';

// Onboarding group. The 5-step wizard + step guard land in Phase 1.
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
