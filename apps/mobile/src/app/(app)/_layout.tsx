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
  const isIOS = process.env.EXPO_OS === 'ios';
  // Full-height sheets. On iOS the sheet shows its native navigation bar — the
  // screen's `SheetChrome` puts close, the title and actions there (Liquid Glass on
  // iOS 26) — translucent over the content like the pages' bar, and the system
  // grabber. Android form sheets have no header; there `SheetChrome` draws the same
  // chrome in content.
  const sheet: NativeStackNavigationOptions = {
    presentation: 'formSheet',
    headerShown: isIOS,
    sheetAllowedDetents: [1],
    sheetCornerRadius: theme.radius.showcase,
    sheetGrabberVisible: isIOS,
    contentStyle: { backgroundColor: theme.colors.bg.elevated },
  };

  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="analytics" options={{ title: t('tabs.analytics') }} />
      {/* No title: the name heads the content; "⋯" is the screen's own toolbar menu. */}
      <Stack.Screen name="clients/[clientId]" options={{ title: '' }} />
      <Stack.Screen name="settings/profile" options={{ title: t('navigation.profileSettings') }} />
      <Stack.Screen name="settings/services" options={{ title: t('services.title') }} />
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
      {/* "Новая запись": the same full-height sheet, with its own Stack inside (the steps
          bring the native bar). Android form sheets can't hold a nested Stack: a modal. */}
      <Stack.Screen
        name="(modals)/quick-create"
        options={
          isIOS
            ? { ...sheet, headerShown: false }
            : { presentation: 'modal', headerShown: false, contentStyle: sheet.contentStyle }
        }
      />
    </Stack>
  );
}
