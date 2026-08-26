import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useUnistyles } from 'react-native-unistyles';
import { NavigationHeaderBackground } from '@/shared/ui/NavigationHeaderBackground';

export const unstable_settings = { initialRouteName: 'index' };

export default function QuickCreateLayout() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerTransparent: process.env.EXPO_OS === 'ios',
        headerShadowVisible: false,
        headerTintColor: theme.colors.content.primary,
        headerBackground: () => <NavigationHeaderBackground />,
        statusBarStyle: theme.name === 'dark' ? 'light' : 'dark',
        contentStyle: { backgroundColor: theme.colors.bg.canvas },
      }}>
      <Stack.Screen name="index" options={{ title: t('quickCreate.startTitle') }} />
      <Stack.Screen name="client" options={{ title: t('quickCreate.clientTitle') }} />
      <Stack.Screen name="services" options={{ title: t('quickCreate.servicesTitle') }} />
      <Stack.Screen name="date-time" options={{ title: t('quickCreate.dateTimeTitle') }} />
      <Stack.Screen name="review" options={{ title: t('quickCreate.reviewTitle') }} />
    </Stack>
  );
}
