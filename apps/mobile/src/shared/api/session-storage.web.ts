/**
 * Supabase auth storage for browser and static rendering.
 *
 * SecureStore and encrypted MMKV are native-only. Browser sessions use the
 * platform's localStorage through the web storage facade; Expo static rendering
 * receives only its isolated in-memory fallback.
 */
import { mmkvSyncStorage } from './storage';

export const sessionStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => mmkvSyncStorage.getItem(key),
  setItem: async (key: string, value: string): Promise<void> => {
    mmkvSyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    mmkvSyncStorage.removeItem(key);
  },
};
