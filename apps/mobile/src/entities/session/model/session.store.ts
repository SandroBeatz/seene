/**
 * Session store — backs the auth/onboarding guard. Ports the web `session.store`
 * semantics including the auth-lock rule (docs/state-management.md §3):
 *
 *   1. Subscribe to `onAuthChange` BEFORE the first `getCurrentSession()`.
 *   2. The auth-change callback stays synchronous; profile fetches are deferred to
 *      the next macrotask so they never run inside Supabase's auth lock.
 *   3. An in-flight profile fetch is tracked; the guard `await`s `waitForReady()`
 *      before deciding, and `isSyncing` keeps it from reading a stale `null` profile
 *      right after login.
 *   4. Signing out clears session + profile synchronously.
 */
import { create } from 'zustand';
import {
  fetchSessionProfile,
  getCurrentSession,
  onAuthChange,
  type Session,
  signOut as apiSignOut,
} from '../api/session.api';
import type { SessionProfile } from './types';

interface SessionState {
  session: Session | null;
  profile: SessionProfile | null;
  /** True once the initial session + profile load has settled. */
  isInitialized: boolean;
  /** True while a profile fetch is in flight (guard shows a splash, doesn't redirect). */
  isSyncing: boolean;
  init: () => Promise<void>;
  waitForReady: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

let initPromise: Promise<void> | null = null;
let processingPromise: Promise<void> | null = null;

export const useSessionStore = create<SessionState>((set, get) => {
  function loadProfile(userId: string): Promise<void> {
    set({ isSyncing: true });
    processingPromise = (async () => {
      try {
        const profile = await fetchSessionProfile(userId);
        set({ profile });
      } finally {
        set({ isSyncing: false });
        processingPromise = null;
      }
    })();
    return processingPromise;
  }

  return {
    session: null,
    profile: null,
    isInitialized: false,
    isSyncing: false,

    init: () => {
      if (initPromise) return initPromise;
      initPromise = (async () => {
        // Subscribe FIRST so no refresh event is missed (rule 1).
        onAuthChange((session) => {
          // Synchronous only (rule 2): update state, defer any network call.
          if (!session) {
            set({ session: null, profile: null, isSyncing: false });
            return;
          }
          set({ session });
          setTimeout(() => void loadProfile(session.user.id), 0);
        });

        const session = await getCurrentSession();
        set({ session });
        if (session) await loadProfile(session.user.id);
        set({ isInitialized: true });
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

    signOut: async () => {
      // The auth-change listener clears session + profile once the sign-out lands.
      await apiSignOut();
    },
  };
});
