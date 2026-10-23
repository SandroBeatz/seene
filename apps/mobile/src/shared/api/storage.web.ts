/**
 * Browser/SSR storage facade.
 *
 * MMKV is a native module, so Expo's static web renderer must not import it.
 * Browser builds persist non-secret app state in localStorage; static rendering
 * uses an in-memory fallback and therefore never leaks state between requests.
 */
const serverStorage = new Map<string, string>();

function getBrowserStorage(): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    // Storage can be unavailable in restricted/private browser contexts.
    return null;
  }
}

function getString(key: string): string | null {
  return getBrowserStorage()?.getItem(key) ?? serverStorage.get(key) ?? null;
}

function set(key: string, value: string): void {
  const storage = getBrowserStorage();
  if (storage) storage.setItem(key, value);
  else serverStorage.set(key, value);
}

function remove(key: string): void {
  const storage = getBrowserStorage();
  if (storage) storage.removeItem(key);
  else serverStorage.delete(key);
}

/** Web-compatible subset of the native MMKV instance used by this app. */
export const appStorage = {
  getString,
  set,
  remove,
};

export const kv = {
  getString,
  set,
  delete: remove,
};

export const mmkvSyncStorage = {
  getItem: getString,
  setItem: set,
  removeItem: remove,
};
