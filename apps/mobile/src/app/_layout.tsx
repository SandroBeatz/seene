// Unistyles MUST be configured before any styled component renders — keep this first.
import '@/shared/theme/unistyles';

import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UnistylesRuntime, useUnistyles } from 'react-native-unistyles';
import { useSessionStore } from '@/entities/session';
import { initQueryManagers, queryClient, queryPersister } from '@/shared/api/query-client';
import { initI18n } from '@/shared/lib/i18n';
import { useAuthReturnIntent } from '@/shared/lib/navigation/useAuthReturnIntent';
import { initSentry, wrap } from '@/shared/lib/observability/sentry';
import { useThemeStore } from '@/shared/theme/theme.store';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

initSentry();
initI18n();
initQueryManagers();
void SplashScreen.preventAutoHideAsync();

function RootLayout() {
  useThemeStore();
  const { theme } = useUnistyles();
  const router = useRouter();
  const canvas = theme.colors.bg.canvas;

  const init = useSessionStore((state) => state.init);
  const signOut = useSessionStore((state) => state.signOut);
  const isInitialized = useSessionStore((state) => state.isInitialized);
  const isSyncing = useSessionStore((state) => state.isSyncing);
  const sessionError = useSessionStore((state) => state.sessionError);
  const session = useSessionStore((state) => state.session);
  const profile = useSessionStore((state) => state.profile);

  const isDeactivated = Boolean(session && profile?.deactivated_at);
  const isRestoring = !isInitialized || isSyncing || isDeactivated;
  const hasSessionError = Boolean(sessionError) && !isSyncing;
  const canUseAuth = !isRestoring && !hasSessionError && !session;
  const canUseOnboarding = !isRestoring && !hasSessionError && Boolean(session) && !profile;
  const canUseApp = !isRestoring && !hasSessionError && Boolean(session && profile);
  const { returnTo, clearReturnTo } = useAuthReturnIntent(!canUseApp);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (isDeactivated) void signOut();
  }, [isDeactivated, signOut]);

  useEffect(() => {
    UnistylesRuntime.setRootViewBackgroundColor(canvas);
  }, [canvas]);

  useEffect(() => {
    if (isInitialized && !isSyncing) void SplashScreen.hideAsync();
  }, [isInitialized, isSyncing]);

  useEffect(() => {
    if (!canUseApp || !returnTo) return;
    router.replace(returnTo);
    clearReturnTo();
  }, [canUseApp, clearReturnTo, returnTo, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} animated />
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: queryPersister }}>
          <BottomSheetModalProvider>
            <ErrorBoundary>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: canvas },
                }}>
                <Stack.Protected guard={isRestoring && !hasSessionError}>
                  <Stack.Screen name="session-restoring" />
                </Stack.Protected>

                <Stack.Protected guard={hasSessionError}>
                  <Stack.Screen name="session-error" />
                </Stack.Protected>

                <Stack.Protected guard={canUseAuth}>
                  <Stack.Screen name="(auth)" />
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default wrap(RootLayout);
