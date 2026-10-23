/**
 * Master-profile api — the only master-layer module allowed to import the Supabase
 * client (docs/api-layer.md §1). Backs onboarding: username availability, the
 * `master_profile` insert, and the `master_settings` upsert.
 */
import { supabase } from '@/shared/api/supabase';
import type { Database, Json } from '@/shared/api/database.types';
import type { OnboardingDraft } from '../model/types';

type MasterSettingsInsert = Database['public']['Tables']['master_settings']['Insert'];

/** Globally-unique username check via the `check_username_available` RPC. */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_username_available', {
    p_username: username,
  });
  if (error) throw error;
  return data ?? false;
}

/** Insert the master's profile from the onboarding draft. Returns the new row id. */
export async function createMasterProfile(
  userId: string,
  draft: OnboardingDraft,
): Promise<string> {
  const { data, error } = await supabase
    .from('master_profile')
    .insert({
      user_id: userId,
      first_name: draft.first_name.trim(),
      last_name: draft.last_name.trim(),
      phone: draft.phone.trim(),
      username: draft.username.trim(),
      specializations: draft.specializations,
      country: draft.country.trim().toUpperCase(),
      address: draft.address.trim() || null,
      house_number: draft.house_number.trim() || null,
      zip_code: draft.zip_code.trim() || null,
      city: draft.city.trim() || null,
      works_at_place: draft.works_at_place,
      can_travel: draft.can_travel,
      schedule: draft.schedule as unknown as Json,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

/**
 * Upsert the master's settings (keyed on `user_id`). Failure here is non-fatal to
 * onboarding (docs/business-logic.md §3 Step 5) — the caller decides how to react.
 */
export async function upsertMasterSettings(
  userId: string,
  settings: Pick<MasterSettingsInsert, 'time_format' | 'language' | 'theme'>,
): Promise<void> {
  const { error } = await supabase
    .from('master_settings')
    .upsert({ user_id: userId, ...settings }, { onConflict: 'user_id' });
  if (error) throw error;
}
