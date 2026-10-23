/**
 * TanStack Query client + MMKV cache persistence, plus focus/online managers wired
 * to AppState and NetInfo (so queries revalidate on foreground and mutations pause
 * offline). See docs/state-management.md §2 & §5.
 */
import { AppState, type AppStateStatus, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { mmkvSyncStorage } from './storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // lists ~30s; analytics override per-query
      gcTime: 1000 * 60 * 60 * 24, // keep cache 24h for offline reads
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

/** Persister for @tanstack/react-query-persist-client (PersistQueryClientProvider). */
export const queryPersister = createSyncStoragePersister({
  storage: mmkvSyncStorage,
  key: 'seene-query-cache',
});

// ---- online + focus managers (call once at app start) ----
let managersReady = false;

export function initQueryManagers(): void {
  if (managersReady) return;
  managersReady = true;

  onlineManager.setEventListener((setOnline) => {
    const sub = NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected);
    });
    return sub;
  });

  focusManager.setEventListener((handleFocus) => {
    const sub = AppState.addEventListener('change', (status: AppStateStatus) => {
      if (Platform.OS !== 'web') handleFocus(status === 'active');
    });
    return () => sub.remove();
  });
}
