import { type NativeStackNavigationOptions, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useUnistyles } from 'react-native-unistyles';
import { useStackScreenOptions } from '@/shared/ui';

export const unstable_settings = { anchor: '(tabs)' };

/**
 * Protected application stack: the tabs are the base; every screen pushed from a
 * tab (client profile, settings pages, analytics) and every modal is a sibling, so
 * it covers the tab bar instead of sitting under it.
 */
export default function AppLayout() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const stackOptions = useStackScreenOptions();
  const sheet: NativeStackNavigationOptions = {
    presentation: 'formSheet',
    headerShown: false,
    sheetAllowedDetents: [1],
    sheetCornerRadius: theme.radius.showcase,
    sheetGrabberVisible: false,
    contentStyle: { backgroundColor: theme.colors.bg.elevated },
  };

  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="analytics" options={{ title: t('tabs.analytics') }} />
      {/* The profile draws its own back and "⋯" buttons. */}
      <Stack.Screen
        name="clients/[clientId]"
        options={{ title: t('navigation.clientDetails'), headerShown: false }}
      />
      <Stack.Screen name="settings/profile" options={{ title: t('navigation.profileSettings') }} />
      <Stack.Screen name="settings/services" options={{ title: t('services.title') }} />
      {/* Full-height sheets; the grabber is drawn in content so iOS and Android match. */}
      <Stack.Screen name="(modals)/appointment/[appointmentId]/index" options={sheet} />
      <Stack.Screen name="(modals)/appointment/[appointmentId]/note" options={sheet} />
      <Stack.Screen name="(modals)/appointment/[appointmentId]/services" options={sheet} />
      <Stack.Screen name="(modals)/appointment/[appointmentId]/reschedule" options={sheet} />
      <Stack.Screen name="(modals)/appointment/[appointmentId]/checkout" options={sheet} />
      <Stack.Screen name="(modals)/client/new" options={sheet} />
      <Stack.Screen name="(modals)/client/[clientId]/merge" options={sheet} />
      <Stack.Screen name="(modals)/client/[clientId]/note" options={sheet} />
      <Stack.Screen name="(modals)/client/[clientId]/edit" options={sheet} />
      <Stack.Screen
        name="(modals)/appointment-form"
        options={{ presentation: 'modal', title: t('navigation.appointmentForm') }}
      />
      <Stack.Screen
        name="(modals)/quick-create"
        options={{ presentation: 'fullScreenModal', headerShown: false }}
      />
    </Stack>
  );
}
