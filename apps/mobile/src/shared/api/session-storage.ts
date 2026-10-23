/**
 * Secure session storage adapter for Supabase (Q-ARCH-2: encrypted MMKV).
 *
 * The Supabase session blob can exceed expo-secure-store's ~2KB value limit, so we
 * store it in a dedicated *encrypted* MMKV instance and keep only the 32-byte
 * encryption key in the OS keychain/keystore via expo-secure-store.
 *
 * The MMKV instance is created lazily on first access because the encryption key
 * must be fetched/generated asynchronously from SecureStore. Supabase's storage
 * interface is async, so lazy init is safe here.
 */
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { createMMKV, type MMKV } from 'react-native-mmkv';

const ENCRYPTION_KEY_ID = 'seene.session.mmkvKey';

let storePromise: Promise<MMKV> | null = null;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function getOrCreateEncryptionKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(ENCRYPTION_KEY_ID);
  if (existing) return existing;
  const key = toHex(Crypto.getRandomBytes(32));
  await SecureStore.setItemAsync(ENCRYPTION_KEY_ID, key, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
  return key;
}

function getStore(): Promise<MMKV> {
  if (!storePromise) {
    storePromise = getOrCreateEncryptionKey().then((encryptionKey) =>
      createMMKV({ id: 'seene-session', encryptionKey }),
    );
  }
  return storePromise;
}

/** Async storage adapter passed to `createClient({ auth: { storage } })`. */
export const sessionStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const store = await getStore();
    return store.getString(key) ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    const store = await getStore();
    store.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    const store = await getStore();
    store.remove(key);
  },
};
