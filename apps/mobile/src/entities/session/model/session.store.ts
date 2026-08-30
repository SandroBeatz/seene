/**
 * Session store — backs the auth/onboarding guard. Ports the web `session.store`
 * semantics including the auth-lock rule (docs/state-management.md §3):
 *
 *   1. Subscribe to `onAuthChange` BEFORE the first `getCurrentSession()`.
 *   2. The auth-change callback stays synchronous; profile fetches are deferred to
 *      the next macrotask so they never run inside Supabase's auth lock.
 *   3. Profile loads are deduplicated by user and stale responses are ignored.
 *   4. `isSyncing` keeps protected-route guards from reading a stale `null` profile.
 *   5. A successful sign-out clears local session state even if the auth callback is delayed.
 */
import { create } from 'zustand';
import { normalizeError } from '@/shared/api/errors';
import { kv } from '@/shared/api/storage';
import {
  fetchSessionProfile,
  getCurrentSession,
  onAuthChange,
  type Session,
  signOut as apiSignOut,
} from '../api/session.api';
import type { SessionProfile } from './types';

/**
 * Last-known profile cache. The guard needs a profile synchronously on cold start,
 * but the imperative fetch bypasses the persisted TanStack cache — so on an offline
 * launch a network failure would otherwise hard-fail to the session-error screen
 * despite `offlineMode`. We mirror the profile into non-secret MMKV and fall back to
 * it when (and only when) the fetch fails with a network error.
 */
const PROFILE_CACHE_PREFIX = 'session-profile:';
const profileCacheKey = (userId: string) => `${PROFILE_CACHE_PREFIX}${userId}`;

function readCachedProfile(userId: string): SessionProfile | null {
  const raw = kv.getString(profileCacheKey(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionProfile;
  } catch {
    return null;
  }
}

function writeCachedProfile(userId: string, profile: SessionProfile | null): void {
  if (profile) kv.set(profileCacheKey(userId), JSON.stringify(profile));
  else kv.delete(profileCacheKey(userId));
}

interface SessionState {
  session: Session | null;
  profile: SessionProfile | null;
  /** True once the initial session + profile load has settled. */
  isInitialized: boolean;
  /** True while a profile fetch is in flight (guard shows a splash, doesn't redirect). */
  isSyncing: boolean;
  /** Session/profile restoration error. Protected routing pauses until retry succeeds. */
  sessionError: unknown | null;
  init: () => Promise<void>;
  waitForReady: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  retry: () => Promise<void>;
  signOut: () => Promise<void>;
}

let initPromise: Promise<void> | null = null;
let processingPromise: Promise<void> | null = null;
let activeProfileLoad: { userId: string; promise: Promise<void> } | null = null;
let profileRequestId = 0;

export const useSessionStore = create<SessionState>((set, get) => {
  function loadProfile(userId: string): Promise<void> {
    if (activeProfileLoad?.userId === userId) return activeProfileLoad.promise;

    const requestId = ++profileRequestId;
    set({ isSyncing: true });
    const promise = (async () => {
      try {
        const profile = await fetchSessionProfile(userId);
        if (requestId === profileRequestId && get().session?.user.id === userId) {
          set({ profile, sessionError: null });
          writeCachedProfile(userId, profile);
        }
      } catch (error) {
        if (requestId === profileRequestId && get().session?.user.id === userId) {
          // Offline cold start: serve the last-known profile instead of hard-failing.
          const cached = readCachedProfile(userId);
          if (cached && normalizeError(error).kind === 'network') {
            set({ profile: cached, sessionError: null });
            return; // recovered — resolve so init() does not flag a session error
          }
          set({ sessionError: error });
        }
        throw error;
      } finally {
        if (requestId === profileRequestId) {
          set({ isSyncing: false });
          activeProfileLoad = null;
          processingPromise = null;
        }
      }
    })();
    activeProfileLoad = { userId, promise };
    processingPromise = promise;
    return promise;
  }

  function clearSession(): void {
    const userId = get().session?.user.id;
    profileRequestId += 1;
    activeProfileLoad = null;
    processingPromise = null;
    if (userId) writeCachedProfile(userId, null);
    set({ session: null, profile: null, isSyncing: false, sessionError: null });
  }

  return {
    session: null,
    profile: null,
    isInitialized: false,
    isSyncing: false,
    sessionError: null,

    init: () => {
      if (initPromise) return initPromise;
      initPromise = (async () => {
        // Subscribe FIRST so no refresh event is missed (rule 1).
        onAuthChange((session) => {
          // Synchronous only (rule 2): update state, defer any network call.
          if (!session) {
            clearSession();
            return;
          }
          const current = get();
          const sameUser = current.session?.user.id === session.user.id;
          set({ session, profile: sameUser ? current.profile : null, sessionError: null });
          if (!sameUser || !current.profile) {
            setTimeout(() => void loadProfile(session.user.id).catch(() => undefined), 0);
          }
        });

        try {
          const session = await getCurrentSession();
          set({ session, sessionError: null });
          if (session) await loadProfile(session.user.id);
        } catch (error) {
          set({ sessionError: error });
        } finally {
          set({ isInitialized: true });
        }
      })();
      return initPromise;
    },

    waitForReady: async () => {
      if (initPromise) await initPromise;
      if (processingPromise) await processingPromise;
    },

    refreshProfile: async () => {
      const userId = get().session?.user.id;
      if (!userId) return;
      await loadProfile(userId);
    },

    retry: async () => {
      set({ sessionError: null });
      try {
        const session = get().session ?? (await getCurrentSession());
        set({ session });
        if (session) await loadProfile(session.user.id);
      } catch (error) {
        set({ sessionError: error, isSyncing: false });
      }
    },

    signOut: async () => {
      await apiSignOut();
      clearSession();
    },
  };
});
