/**
 * Client api — the only supabase import site for this entity. `client` is owner-scoped
 * by RLS (no public read), but reads still filter `.eq('user_id', userId)` to return
 * only the caller's address book. Create surfaces `duplicate_phone` (23505) and delete
 * surfaces `has_related_records` (23503, RESTRICT) via normalizeError at the UI.
 */
import { supabase } from '@/shared/api/supabase';
import type { Client, CreateClientDto, UpdateClientDto } from '../model/types';

export async function listClients(userId: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from('client')
    .select('*')
    .eq('user_id', userId)
    .order('is_favorite', { ascending: false })
    .order('first_name');
  if (error) throw error;
  return data;
}

export async function getClient(id: string): Promise<Client | null> {
  const { data, error } = await supabase.from('client').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function createClient(userId: string, dto: CreateClientDto): Promise<Client> {
  const { data, error } = await supabase
    .from('client')
    .insert({ ...dto, user_id: userId })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateClient(dto: UpdateClientDto): Promise<Client> {
  const { id, ...patch } = dto;
  const { data, error } = await supabase
    .from('client')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/** Hot toggle backing the optimistic favourite star. */
export async function setClientFavorite(id: string, isFavorite: boolean): Promise<Client> {
  const { data, error } = await supabase
    .from('client')
    .update({ is_favorite: isFavorite })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/** RESTRICT: throws 23503 (→ has_related_records) if the client has appointments. */
export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('client').delete().eq('id', id);
  if (error) throw error;
}
