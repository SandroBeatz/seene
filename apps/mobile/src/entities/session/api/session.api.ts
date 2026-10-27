/**
 * Session/auth api — the ONLY session-layer module allowed to touch the Supabase
 * client (docs/api-layer.md §1). Everything auth-related (sign in/up/out, OAuth,
 * session subscription, profile fetch) funnels through here; the store and UI
 * call these, never `supabase` directly.
 */
import { createURL } from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Session, Subscription } from '@supabase/supabase-js';
import { supabase } from '@/shared/api/supabase';
import type { SessionProfile } from '../model/types';

export type { Session } from '@supabase/supabase-js';

const PROFILE_COLUMNS = 'id, first_name, last_name, username, avatar_url, deactivated_at';

/**
 * Passwordless email sign-in, step 1: email a 6-digit code (the Supabase "Magic
 * Link" template must contain `{{ .Token }}`). Creates the account on first use, so
 * sign-in and sign-up are one flow. Rate-limited server-side (one per ~60s).
 */
export async function sendEmailCode(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

/**
 * Step 2: exchange the code for a session. The session reaches the app through
 * `onAuthChange`, which flips the root guards (→ onboarding or the app).
 */
export async function verifyEmailCode(email: string, token: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Subscribe to auth changes. The callback runs on Supabase's auth-lock thread, so
 * it MUST stay synchronous — callers must never `await supabase` inside it
 * (docs/state-management.md §3 rule 2).
 */
export function onAuthChange(
  cb: (session: Session | null) => void,
): Subscription {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return data.subscription;
}

export async function fetchSessionProfile(userId: string): Promise<SessionProfile | null> {
  const { data, error } = await supabase
    .from('master_profile')
    .select(PROFILE_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/**
 * Native Google OAuth via the PKCE flow: open the system auth session, then
 * exchange the returned `code` for a Supabase session. Uses only bundled Expo
 * modules (no expo-auth-session dependency).
 */
export async function signInWithGoogle(): Promise<boolean> {
  const redirectTo = createURL('auth/callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return false;

  const code = new URL(result.url).searchParams.get('code');
  if (!code) return false;

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
  return true;
}
