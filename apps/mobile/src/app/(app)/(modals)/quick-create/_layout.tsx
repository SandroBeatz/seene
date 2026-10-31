import { type NativeStackNavigationOptions, Stack } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';
import { useStackScreenOptions } from '@/shared/ui';

export const unstable_settings = { initialRouteName: 'index' };

/**
 * "Новая запись": one sheet with its own Stack — client → services → date and time →
 * review. On iOS each step has the native bar (title, Back, close); "Своё время" and
 * the month calendar are native sheets over the step. Android sheets have no header,
 * so the steps draw the same chrome in content.
 */
export default function QuickCreateLayout() {
  const { theme } = useUnistyles();
  const stackOptions = useStackScreenOptions();
  const isIOS = process.env.EXPO_OS === 'ios';

  const sheet: NativeStackNavigationOptions = {
    presentation: 'formSheet',
    headerShown: isIOS,
    sheetCornerRadius: theme.radius.showcase,
    sheetGrabberVisible: isIOS,
    contentStyle: { backgroundColor: theme.colors.bg.elevated },
  };

  return (
    <Stack
      screenOptions={{
        ...stackOptions,
        headerShown: isIOS,
        contentStyle: { backgroundColor: theme.colors.bg.elevated },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="services" />
      <Stack.Screen name="date-time" />
      <Stack.Screen name="review" />
      <Stack.Screen name="custom-time" options={{ ...sheet, sheetAllowedDetents: [0.62] }} />
      <Stack.Screen name="month" options={{ ...sheet, sheetAllowedDetents: [0.85] }} />
    </Stack>
  );
}
