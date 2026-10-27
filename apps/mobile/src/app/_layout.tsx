// Unistyles MUST be configured before any styled component renders — keep this first.
import '@/shared/theme/unistyles';

import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UnistylesRuntime, useUnistyles } from 'react-native-unistyles';
import { useSessionStore } from '@/entities/session';
import { initQueryManagers, queryClient, queryPersister } from '@/shared/api/query-client';
import { initI18n } from '@/shared/lib/i18n';
import { useAuthReturnIntent } from '@/shared/lib/navigation/useAuthReturnIntent';
import { initSentry, wrap } from '@/shared/lib/observability/sentry';
import { useAppFonts } from '@/shared/theme/fonts';
import { useThemeStore } from '@/shared/theme/theme.store';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

initSentry();
initI18n();
initQueryManagers();
void SplashScreen.preventAutoHideAsync();

function RootLayout() {
  useThemeStore();
  const fontsReady = useAppFonts();
  const { theme } = useUnistyles();
  const router = useRouter();
  const canvas = theme.colors.bg.canvas;

  const init = useSessionStore((state) => state.init);
  const isInitialized = useSessionStore((state) => state.isInitialized);
  const isSyncing = useSessionStore((state) => state.isSyncing);
  const sessionError = useSessionStore((state) => state.sessionError);
  const session = useSessionStore((state) => state.session);
  const profile = useSessionStore((state) => state.profile);

  // A deactivated master is its own destination (not a silent sign-out): they have a
  // session and a profile, but the app and onboarding are closed to them.
  const isDeactivated = Boolean(session && profile?.deactivated_at);
  const isBooting = !isInitialized || isSyncing;
  const hasSessionError = Boolean(sessionError) && !isSyncing;
  const canRestore = isBooting && !hasSessionError;
  const canUseAuth = !isBooting && !hasSessionError && !session;
  const canUseDeactivated = !isBooting && !hasSessionError && isDeactivated;
  const canUseOnboarding = !isBooting && !hasSessionError && Boolean(session) && !profile;
  const canUseApp = !isBooting && !hasSessionError && Boolean(session && profile) && !isDeactivated;
  const { returnTo, clearReturnTo } = useAuthReturnIntent(!canUseApp);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    UnistylesRuntime.setRootViewBackgroundColor(canvas);
  }, [canvas]);

  useEffect(() => {
    if (fontsReady && isInitialized && !isSyncing) void SplashScreen.hideAsync();
  }, [fontsReady, isInitialized, isSyncing]);

  useEffect(() => {
    if (!canUseApp || !returnTo) return;
    router.replace(returnTo);
    clearReturnTo();
  }, [canUseApp, clearReturnTo, returnTo, router]);

  if (!fontsReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister: queryPersister }}>
            <BottomSheetModalProvider>
              <ErrorBoundary>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    statusBarStyle: theme.name === 'dark' ? 'light' : 'dark',
                    contentStyle: { backgroundColor: canvas },
                  }}>
                  <Stack.Protected guard={canRestore}>
                    <Stack.Screen name="session-restoring" />
                  </Stack.Protected>

                  <Stack.Protected guard={hasSessionError}>
                    <Stack.Screen name="session-error" />
                  </Stack.Protected>

                  <Stack.Protected guard={canUseAuth}>
                    <Stack.Screen name="(auth)" />
                  </Stack.Protected>

                  <Stack.Protected guard={canUseDeactivated}>
                    <Stack.Screen name="account-deactivated" />
                  </Stack.Protected>

                  <Stack.Protected guard={canUseOnboarding}>
                    <Stack.Screen name="(onboarding)" />
                  </Stack.Protected>

                  <Stack.Protected guard={canUseApp}>
                    <Stack.Screen name="(app)" />
                  </Stack.Protected>

                  <Stack.Protected guard={__DEV__ && canUseApp}>
                    <Stack.Screen name="(dev)" />
                  </Stack.Protected>

                  <Stack.Screen name="+not-found" />
                </Stack>
              </ErrorBoundary>
            </BottomSheetModalProvider>
          </PersistQueryClientProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default wrap(RootLayout);
