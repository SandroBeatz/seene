/**
 * Time-block api — the only supabase import site for this entity. Owner-scoped by RLS;
 * reads still filter `.eq('user_id', userId)`.
 */
import { supabase } from '@/shared/api/supabase';
import type { CreateTimeBlockDto, TimeBlock, UpdateTimeBlockDto } from '../model/types';

/** Time blocks overlapping [fromIso, toIso): start before the end AND end after the start. */
export async function listTimeBlocksByRange(
  userId: string,
  fromIso: string,
  toIso: string,
): Promise<TimeBlock[]> {
  const { data, error } = await supabase
    .from('time_block')
    .select('*')
    .eq('user_id', userId)
    .lt('start_at', toIso)
    .gt('end_at', fromIso)
    .order('start_at');
  if (error) throw error;
  return data;
}

export async function createTimeBlock(
  userId: string,
  dto: CreateTimeBlockDto,
): Promise<TimeBlock> {
  const { data, error } = await supabase
    .from('time_block')
    .insert({ ...dto, user_id: userId })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateTimeBlock(dto: UpdateTimeBlockDto): Promise<TimeBlock> {
  const { id, ...patch } = dto;
  const { data, error } = await supabase
    .from('time_block')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTimeBlock(id: string): Promise<void> {
  const { error } = await supabase.from('time_block').delete().eq('id', id);
  if (error) throw error;
}
