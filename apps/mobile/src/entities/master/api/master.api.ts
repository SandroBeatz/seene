/**
 * Master-profile api — the only master-layer module allowed to import the Supabase
 * client (docs/api-layer.md §1). Backs onboarding: username availability, the
 * one-shot `complete_onboarding` write, the provider photo import.
 */
import { supabase } from '@/shared/api/supabase';
import type { Json } from '@/shared/api/database.types';
import type {
  CompleteOnboardingPayload,
  MasterImageKind,
  MasterProfile,
  MasterProfilePatch,
  MasterSettings,
  MasterSettingsPatch,
  StoredSchedule,
} from '../model/types';

const PROFILE_COLUMNS =
  'id, first_name, last_name, username, avatar_url, cover_url, bio, schedule, whatsapp, telegram, instagram, phone, address, house_number, city, country, specializations';
const SETTINGS_COLUMNS =
  'currency, time_format, date_format, calendar_slot_step_minutes, language, theme, online_booking_enabled, booking_default_status, booking_min_notice_minutes, booking_horizon_days, booking_buffer_minutes, cancel_window_hours, allow_client_reschedule, booking_show_prices, booking_allow_comment, show_portfolio';

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

export async function updateMasterSettings(
  userId: string,
  patch: MasterSettingsPatch,
): Promise<void> {
  const { error } = await supabase.from('master_settings').update(patch).eq('user_id', userId);
  if (error) throw error;
}

/** The zone lives inside `schedule`; the week around it is written back untouched. */
export async function updateMasterTimezone(
  userId: string,
  schedule: Json,
  timezone: string,
): Promise<void> {
  const next = { ...(schedule as Record<string, Json | undefined>), timezone };
  const { error } = await supabase
    .from('master_profile')
    .update({ schedule: next })
    .eq('user_id', userId);
  if (error) throw error;
}

/** The week lives inside `schedule`; the zone around it is written back untouched. */
export async function updateMasterWeek(
  userId: string,
  schedule: Json,
  days: StoredSchedule['days'],
): Promise<void> {
  const next = { ...(schedule as Record<string, Json | undefined>), days: days as unknown as Json };
  const { error } = await supabase
    .from('master_profile')
    .update({ schedule: next })
    .eq('user_id', userId);
  if (error) throw error;
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

export async function updateMasterProfile(
  userId: string,
  patch: MasterProfilePatch,
): Promise<void> {
  const { error } = await supabase.from('master_profile').update(patch).eq('user_id', userId);
  if (error) throw error;
}

const IMAGE_BUCKET = {
  avatar: 'avatars',
  cover: 'master-media',
} as const;

/**
 * Removes the earlier files of this kind. Only tidying: the profile already points at
 * the new file, so a failure here must not fail the save. The prefix keeps portfolio
 * photos safe, they share the `master-media` folder.
 */
async function removeOldImages(userId: string, kind: MasterImageKind, keep?: string) {
  try {
    const bucket = supabase.storage.from(IMAGE_BUCKET[kind]);
    const { data } = await bucket.list(userId, { search: kind });
    const stale = (data ?? [])
      .filter((file) => file.name.startsWith(kind) && file.name !== keep)
      .map((file) => `${userId}/${file.name}`);
    if (stale.length) await bucket.remove(stale);
  } catch {
    // An orphan file costs little and is removed with the account.
  }
}

/**
 * A picked photo → storage → profile. Every upload gets a new name: the public URL
 * of an overwritten file would keep showing the old picture from caches.
 */
export async function uploadMasterImage(
  userId: string,
  kind: MasterImageKind,
  file: { uri: string; mimeType: string },
): Promise<string> {
  const response = await fetch(file.uri);
  const ext = file.mimeType.includes('png') ? 'png' : file.mimeType.includes('webp') ? 'webp' : 'jpg';
  const name = `${kind}-${Date.now()}.${ext}`;

  const bucket = supabase.storage.from(IMAGE_BUCKET[kind]);
  const upload = await bucket.upload(`${userId}/${name}`, await response.arrayBuffer(), {
    contentType: file.mimeType,
  });
  if (upload.error) throw upload.error;

  const url = bucket.getPublicUrl(`${userId}/${name}`).data.publicUrl;
  const { error } = await supabase
    .from('master_profile')
    .update(kind === 'avatar' ? { avatar_url: url } : { cover_url: url })
    .eq('user_id', userId);
  if (error) throw error;

  await removeOldImages(userId, kind, name);
  return url;
}

export async function removeMasterCover(userId: string): Promise<void> {
  const { error } = await supabase
    .from('master_profile')
    .update({ cover_url: null })
    .eq('user_id', userId);
  if (error) throw error;
  await removeOldImages(userId, 'cover');
}
