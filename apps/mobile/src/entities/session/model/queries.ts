/**
 * Auth mutations for the UI. Components call these hooks (never the api/supabase
 * directly). Session state itself flows in through the store's `onAuthChange`
 * subscription, so these just fire the action and normalize errors.
 */
import { useMutation } from '@tanstack/react-query';
import { type AppError, normalizeError } from '@/shared/api/errors';
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '../api/session.api';

interface Credentials {
  email: string;
  password: string;
}

export function useSignIn() {
  return useMutation<void, AppError, Credentials>({
    mutationFn: async ({ email, password }) => {
      try {
        await signInWithEmail(email, password);
      } catch (e) {
        throw normalizeError(e);
      }
    },
  });
}

export function useSignUp() {
  return useMutation<{ needsConfirmation: boolean }, AppError, Credentials>({
    mutationFn: async ({ email, password }) => {
      try {
        return await signUpWithEmail(email, password);
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
