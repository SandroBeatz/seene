// Unistyles MUST be configured before any styled component renders — keep this first.
import '@/shared/theme/unistyles';

import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UnistylesRuntime, useUnistyles } from 'react-native-unistyles';
import { useSessionStore } from '@/entities/session';
import { initQueryManagers, queryClient, queryPersister } from '@/shared/api/query-client';
import { initI18n } from '@/shared/lib/i18n';
import { initSentry, wrap } from '@/shared/lib/observability/sentry';
import { useThemeStore } from '@/shared/theme/theme.store';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

initSentry();
initI18n();
initQueryManagers();
void SplashScreen.preventAutoHideAsync();

/**
 * Auth/onboarding guard (docs/business-logic.md §3 decision table). Kept in the root
 * layout, not per-screen. Boots the session store once, then redirects between the
 * `(auth)`, `(onboarding)` and `(tabs)` groups based on session + profile. It waits
 * for the initial load and any in-flight profile fetch (`isSyncing`) so it never
 * acts on a stale `null` profile right after login.
 */
function useAuthGuard(): boolean {
  const router = useRouter();
  const segments = useSegments();
  const init = useSessionStore((s) => s.init);
  const signOut = useSessionStore((s) => s.signOut);
  const isInitialized = useSessionStore((s) => s.isInitialized);
  const isSyncing = useSessionStore((s) => s.isSyncing);
  const session = useSessionStore((s) => s.session);
  const profile = useSessionStore((s) => s.profile);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (!isInitialized || isSyncing) return;
    const group = segments[0];
    const inAuth = group === '(auth)';
    const inOnboarding = group === '(onboarding)';

    if (session && profile?.deactivated_at) {
      void signOut(); // clears session → next run routes to login
      return;
    }
    if (!session) {
      if (!inAuth) router.replace('/(auth)');
      return;
    }
    if (!profile) {
      if (!inOnboarding) router.replace('/(onboarding)/welcome');
      return;
    }
    if (inAuth || inOnboarding) router.replace('/(tabs)');
  }, [isInitialized, isSyncing, session, profile, segments, router, signOut]);

  return isInitialized;
}

function RootLayout() {
  // Referencing the store triggers persist hydration, which applies the saved theme.
  useThemeStore();
  const { theme } = useUnistyles();
  const canvas = theme.colors.bg.canvas;
  const isReady = useAuthGuard();

  // Keep the native root window painted in the theme color. This kills the white
  // that shows through behind the translucent Liquid Glass tab bar and during
  // native tab/screen transitions (Unistyles doesn't own the root window).
  useEffect(() => {
    UnistylesRuntime.setRootViewBackgroundColor(canvas);
  }, [canvas]);

  // Hold the splash until the session has resolved so we don't flash the wrong group.
  useEffect(() => {
    if (isReady) void SplashScreen.hideAsync();
  }, [isReady]);

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
                <Stack.Screen name="modal-layout-demo" options={{ presentation: 'modal' }} />
              </Stack>
            </ErrorBoundary>
          </BottomSheetModalProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default wrap(RootLayout);
