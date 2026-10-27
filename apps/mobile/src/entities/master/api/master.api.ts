/**
 * Master-profile api — the only master-layer module allowed to import the Supabase
 * client (docs/api-layer.md §1). Backs onboarding: username availability, the
 * one-shot `complete_onboarding` write.
 */
import { supabase } from '@/shared/api/supabase';
import type { Json } from '@/shared/api/database.types';
import type { CompleteOnboardingPayload } from '../model/types';

/** Globally-unique username check via the `check_username_available` RPC. */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_username_available', {
    p_username: username,
  });
  if (error) throw error;
  return data ?? false;
}

/**
 * The whole onboarding in one transaction (`complete_onboarding` RPC): profile,
 * settings, services and their categories. Returns the new profile id. Raises
 * `already_completed` if the master already has a profile, and a unique violation
 * on `username` if it was taken in the meantime (both mapped by normalizeError).
 */
export async function completeOnboarding(payload: CompleteOnboardingPayload): Promise<string> {
  const { data, error } = await supabase.rpc('complete_onboarding', {
    p_payload: payload as unknown as Json,
  });
  if (error) throw error;
  return data;
}
