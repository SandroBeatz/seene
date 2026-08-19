/**
 * On-device key/value storage built on MMKV.
 *
 * Two instances:
 *  - `appStorage`  — fast, non-secret KV (theme, locale, query-cache persistence,
 *    Zustand persist). Synchronous.
 *  - the Supabase session lives in a *separate, encrypted* MMKV instance whose key
 *    is held in expo-secure-store — see session-storage.ts (Q-ARCH-2).
 */
import { createMMKV } from 'react-native-mmkv';

export const appStorage = createMMKV({ id: 'seene-app' });

/** Minimal sync KV facade so callers don't depend on MMKV directly. */
export const kv = {
  getString: (key: string) => appStorage.getString(key) ?? null,
  set: (key: string, value: string) => appStorage.set(key, value),
  delete: (key: string): void => {
    appStorage.remove(key);
  },
};

/**
 * Synchronous string persister interface used by Zustand `persist` and the
 * TanStack Query sync persister.
 */
export const mmkvSyncStorage = {
  getItem: (key: string): string | null => appStorage.getString(key) ?? null,
  setItem: (key: string, value: string): void => appStorage.set(key, value),
  removeItem: (key: string): void => {
    appStorage.remove(key);
  },
};
