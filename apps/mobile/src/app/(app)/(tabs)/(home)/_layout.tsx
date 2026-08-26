import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useUnistyles } from 'react-native-unistyles';
import { NavigationHeaderBackground } from '@/shared/ui/NavigationHeaderBackground';

export const unstable_settings = { initialRouteName: 'index' };

export default function HomeStackLayout() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerTransparent: process.env.EXPO_OS === 'ios',
        headerShadowVisible: false,
        headerTintColor: theme.colors.content.primary,
        headerLargeTitleStyle: { color: theme.colors.content.primary },
        headerBackground: () => <NavigationHeaderBackground />,
        statusBarStyle: theme.name === 'dark' ? 'light' : 'dark',
        contentStyle: { backgroundColor: theme.colors.bg.canvas },
      }}>
      <Stack.Screen
        name="index"
        options={{ title: t('tabs.home'), headerLargeTitle: process.env.EXPO_OS === 'ios' }}
      />
    </Stack>
  );
}
