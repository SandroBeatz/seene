import { Stack } from 'expo-router';

/** This entire branch is additionally protected by `__DEV__` in the root layout. */
export default function DevLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
