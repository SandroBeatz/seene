// Unistyles MUST be configured before any styled component renders — keep this first.
import '@/shared/theme/unistyles';

import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UnistylesRuntime, useUnistyles } from 'react-native-unistyles';
import { initQueryManagers, queryClient, queryPersister } from '@/shared/api/query-client';
import { initI18n } from '@/shared/lib/i18n';
import { initSentry, wrap } from '@/shared/lib/observability/sentry';
import { useThemeStore } from '@/shared/theme/theme.store';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

initSentry();
initI18n();
initQueryManagers();
void SplashScreen.preventAutoHideAsync();

function RootLayout() {
  // Referencing the store triggers persist hydration, which applies the saved theme.
  useThemeStore();
  const { theme } = useUnistyles();
  const canvas = theme.colors.bg.canvas;

  // Keep the native root window painted in the theme color. This kills the white
  // that shows through behind the translucent Liquid Glass tab bar and during
  // native tab/screen transitions (Unistyles doesn't own the root window).
  useEffect(() => {
    UnistylesRuntime.setRootViewBackgroundColor(canvas);
  }, [canvas]);

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: queryPersister }}>
          <BottomSheetModalProvider>
            <ErrorBoundary>
              <Stack
                screenOptions={{ headerShown: false, contentStyle: { backgroundColor: canvas } }}>
                <Stack.Screen
                  name="modal-layout-demo"
                  options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
                />
              </Stack>
            </ErrorBoundary>
          </BottomSheetModalProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default wrap(RootLayout);
