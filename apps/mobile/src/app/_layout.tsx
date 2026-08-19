// Unistyles MUST be configured before any styled component renders — keep this first.
import '@/shared/theme/unistyles';

import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
              <Stack screenOptions={{ headerShown: false }} />
            </ErrorBoundary>
          </BottomSheetModalProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default wrap(RootLayout);
