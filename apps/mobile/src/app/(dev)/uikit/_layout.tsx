import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useUnistyles } from 'react-native-unistyles';
import { NavigationHeaderBackground } from '@/shared/ui/NavigationHeaderBackground';

export const unstable_settings = { initialRouteName: 'index' };

export default function UIKitLayout() {
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
      <Stack.Screen name="index" options={{ title: t('uikit.title') }} />
      <Stack.Screen name="foundations" options={{ title: t('uikit.sections.foundations') }} />
      <Stack.Screen name="components" options={{ title: t('uikit.sections.components') }} />
      <Stack.Screen name="layouts" options={{ title: t('uikit.sections.layouts') }} />
      <Stack.Screen name="navigation" options={{ title: t('uikit.sections.navigation') }} />
      <Stack.Screen name="modals" options={{ title: t('uikit.sections.modals') }} />
      <Stack.Screen name="authentication" options={{ title: t('uikit.sections.authentication') }} />
      <Stack.Screen name="examples/layouts/basic" options={{ title: t('uikit.layout.basic') }} />
      <Stack.Screen name="examples/layouts/scroll" options={{ title: t('uikit.layout.scroll') }} />
      <Stack.Screen name="examples/layouts/form" options={{ title: t('uikit.layout.form') }} />
      <Stack.Screen name="examples/creating" options={{ headerShown: false }} />
      <Stack.Screen
        name="examples/layouts/dynamic-options"
        options={{ title: t('uikit.layout.dynamic') }}
      />
    </Stack>
  );
}
