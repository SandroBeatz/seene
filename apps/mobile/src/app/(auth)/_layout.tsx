import { Stack } from 'expo-router';

// Auth group. The session guard + real login/register screens land in Phase 1.
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
