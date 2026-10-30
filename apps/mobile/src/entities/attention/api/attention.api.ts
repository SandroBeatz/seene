/**
 * Attention api — the only supabase import site for this entity. Owner-scoped by RLS.
 */
import { supabase } from '@/shared/api/supabase';
import type { DismissDto } from '../model/types';

/** Keys of cards closed for good or snoozed past `nowIso`. */
export async function listActiveDismissals(userId: string, nowIso: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('attention_dismissal')
    .select('key')
    .eq('user_id', userId)
    .or(`until.is.null,until.gt.${nowIso}`);
  if (error) throw error;
  return data.map((row) => row.key);
}

/** Close or snooze cards; the same key again moves its `until`. */
export async function dismissAttention(userId: string, dtos: DismissDto[]): Promise<void> {
  const { error } = await supabase
    .from('attention_dismissal')
    .upsert(dtos.map((dto) => ({ user_id: userId, key: dto.key, until: dto.until })));
  if (error) throw error;
}
