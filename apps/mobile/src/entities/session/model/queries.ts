/**
 * Auth mutations for the UI. Components call these hooks (never the api/supabase
 * directly). Session state itself flows in through the store's `onAuthChange`
 * subscription, so these just fire the action and normalize errors.
 */
import { useMutation } from '@tanstack/react-query';
import { type AppError, normalizeError } from '@/shared/api/errors';
import { sendEmailCode, signInWithGoogle, verifyEmailCode } from '../api/session.api';
import { avatarFromUser } from './auth-avatar';
import { type AuthName, nameFromUser } from './auth-name';
import { useSessionStore } from './session.store';

/**
 * The authenticated master's id. Every entity query keys and RLS-scopes on this, so
 * data hooks gate on it (`enabled: !!userId`). Returns undefined while signed out.
 */
export function useUserId(): string | undefined {
  return useSessionStore((state) => state.session?.user.id);
}

/** The provider's name for the signed-in person (onboarding prefill). */
export function useAuthName(): AuthName {
  return nameFromUser(useSessionStore((state) => state.session?.user));
}

/** The provider's photo for the signed-in person (Google), or null. */
export function useAuthAvatar(): string | null {
  return avatarFromUser(useSessionStore((state) => state.session?.user));
}

export function useSendEmailCode() {
  return useMutation<void, AppError, string>({
    mutationFn: async (email) => {
      try {
        await sendEmailCode(email);
      } catch (e) {
        throw normalizeError(e);
      }
    },
  });
}

export function useVerifyEmailCode() {
  return useMutation<void, AppError, { email: string; code: string }>({
    mutationFn: async ({ email, code }) => {
      try {
        await verifyEmailCode(email, code);
      } catch (e) {
        throw normalizeError(e);
      }
    },
  });
}

export function useSignInWithGoogle() {
  return useMutation<boolean, AppError, void>({
    mutationFn: async () => {
      try {
        return await signInWithGoogle();
      } catch (e) {
        throw normalizeError(e);
      }
    },
  });
}
