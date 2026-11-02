import { type NativeStackNavigationOptions, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { AppointmentToast } from '@/features/appointment-actions';
import { useStackScreenOptions } from '@/shared/ui';

export const unstable_settings = { anchor: '(tabs)' };

/**
 * Protected application stack: the tabs are the base; every screen pushed from a
 * tab (client profile, settings pages, analytics) and every modal is a sibling, so
 * it covers the tab bar instead of sitting under it.
 *
 * "Запись создана" sits after the Stack: native headers and tab bars draw above any
 * screen's content, so a toast inside a screen ends up under the bar's buttons.
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
    <View style={styles.root}>
      <Stack screenOptions={stackOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="analytics/index" options={{ title: t('tabs.analytics') }} />
        <Stack.Screen name="analytics/operations" options={{ title: t('money.operations.title') }} />
        <Stack.Screen name="analytics/clients" options={{ title: '' }} />
        {/* No title: the name heads the content; "⋯" is the screen's own toolbar menu. */}
        <Stack.Screen name="clients/[clientId]" options={{ title: '' }} />
        <Stack.Screen
          name="settings/profile"
          options={{ title: t('navigation.profileSettings') }}
        />
        <Stack.Screen name="settings/services" options={{ title: t('services.title') }} />
        <Stack.Screen name="settings/expenses" options={{ title: t('expenses.title') }} />
        <Stack.Screen name="(modals)/appointment/[appointmentId]/index" options={sheet} />
        <Stack.Screen name="(modals)/appointment/[appointmentId]/note" options={sheet} />
        <Stack.Screen name="(modals)/appointment/[appointmentId]/services" options={sheet} />
        <Stack.Screen name="(modals)/appointment/[appointmentId]/reschedule" options={sheet} />
        <Stack.Screen
          name="(modals)/appointment/[appointmentId]/reschedule-month"
          options={{ ...sheet, sheetAllowedDetents: [0.85] }}
        />
        <Stack.Screen
          name="(modals)/appointment/[appointmentId]/reschedule-time"
          options={{ ...sheet, sheetAllowedDetents: [0.62] }}
        />
        <Stack.Screen name="(modals)/appointment/[appointmentId]/client" options={sheet} />
        <Stack.Screen name="(modals)/appointment/[appointmentId]/checkout" options={sheet} />
        <Stack.Screen
          name="(modals)/expense/new"
          options={{ ...sheet, sheetAllowedDetents: [0.8, 1] }}
        />
        <Stack.Screen
          name="(modals)/expense/[expenseId]"
          options={{ ...sheet, sheetAllowedDetents: [0.8, 1] }}
        />
        <Stack.Screen
          name="(modals)/analytics-range"
          options={{ ...sheet, sheetAllowedDetents: [0.85] }}
        />
        <Stack.Screen name="(modals)/client/new" options={sheet} />
        <Stack.Screen name="(modals)/client/[clientId]/merge" options={sheet} />
        <Stack.Screen name="(modals)/client/[clientId]/note" options={sheet} />
        <Stack.Screen name="(modals)/client/[clientId]/edit" options={sheet} />
        <Stack.Screen
          name="(modals)/appointment-form"
          options={{ presentation: 'modal', title: t('navigation.appointmentForm') }}
        />
        <Stack.Screen name="(modals)/time-block/[blockId]/index" options={sheet} />
        <Stack.Screen name="(modals)/time-block/[blockId]/name" options={sheet} />
        <Stack.Screen name="(modals)/time-block/[blockId]/move" options={sheet} />
        <Stack.Screen
          name="(modals)/time-block/[blockId]/month"
          options={{ ...sheet, sheetAllowedDetents: [0.85] }}
        />
        <Stack.Screen
          name="(modals)/time-block/[blockId]/custom-time"
          options={{ ...sheet, sheetAllowedDetents: [0.62] }}
        />
        {/* "Личное время": like "Новая запись" — a sheet with its own Stack of steps. */}
        <Stack.Screen
          name="(modals)/personal-time"
          options={
            isIOS
              ? { ...sheet, headerShown: false, headerBackground: undefined }
              : { presentation: 'modal', headerShown: false, contentStyle: sheet.contentStyle }
          }
        />
        {/* "Новая запись": the same full-height sheet, with its own Stack inside (the steps
          bring the native bar). Android form sheets can't hold a nested Stack: a modal. */}
        <Stack.Screen
          name="(modals)/quick-create"
          options={
            isIOS
              ? // No header here, so no header background either: inherited from the
                // stack options, it still mounts and veils the steps' own bar.
                { ...sheet, headerShown: false, headerBackground: undefined }
              : { presentation: 'modal', headerShown: false, contentStyle: sheet.contentStyle }
          }
        />
      </Stack>
      <AppointmentToast />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
