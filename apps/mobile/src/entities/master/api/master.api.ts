/**
 * Master-profile api — the only master-layer module allowed to import the Supabase
 * client (docs/api-layer.md §1). Backs onboarding: username availability, the
 * one-shot `complete_onboarding` write, the provider photo import.
 */
import { supabase } from '@/shared/api/supabase';
import type { Json } from '@/shared/api/database.types';
import type { CompleteOnboardingPayload, MasterProfile, MasterSettings } from '../model/types';

const PROFILE_COLUMNS =
  'id, first_name, last_name, username, avatar_url, cover_url, bio, schedule, whatsapp, telegram, instagram, phone, address, city, country';
const SETTINGS_COLUMNS = 'currency, time_format, date_format, calendar_slot_step_minutes';

/** The master's own profile (the fields the app screens read), or null before onboarding. */
export async function getMasterProfile(userId: string): Promise<MasterProfile | null> {
  const { data, error } = await supabase
    .from('master_profile')
    .select(PROFILE_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** The master's display settings (currency, clock), or null before onboarding. */
export async function getMasterSettings(userId: string): Promise<MasterSettings | null> {
  const { data, error } = await supabase
    .from('master_settings')
    .select(SETTINGS_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

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

/**
 * Copies a photo from the sign-in provider into the `avatars` bucket
 * (`<user_id>/avatar.<ext>`) and sets it as the profile's avatar, so the booking
 * page does not depend on the provider's URL. Returns the public URL.
 */
export async function importAvatar(userId: string, sourceUrl: string): Promise<string> {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`avatar download failed: ${response.status}`);
  const contentType = response.headers.get('content-type') ?? 'image/jpeg';
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const bucket = supabase.storage.from('avatars');
  const upload = await bucket.upload(path, await response.arrayBuffer(), {
    contentType,
    upsert: true,
  });
  if (upload.error) throw upload.error;

  const avatarUrl = bucket.getPublicUrl(path).data.publicUrl;
  const { error } = await supabase
    .from('master_profile')
    .update({ avatar_url: avatarUrl })
    .eq('user_id', userId);
  if (error) throw error;
  return avatarUrl;
}
