/**
 * A nested Stack presented by the root navigator as one modal. Pushing `details`
 * keeps the modal presentation in place and animates only its inner route.
 */
import { Stack } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';

export default function ModalLayoutDemoNavigator() {
  const { theme } = useUnistyles();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: theme.colors.bg.canvas },
      }}
    />
  );
}
