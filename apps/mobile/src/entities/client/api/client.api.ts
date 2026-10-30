/**
 * Client api — the only supabase import site for this entity. `client` is owner-scoped
 * by RLS (no public read), but reads still filter `.eq('user_id', userId)` to return
 * only the caller's address book. Create surfaces `duplicate_phone` (23505) and delete
 * surfaces `has_related_records` (23503, RESTRICT) via normalizeError at the UI.
 */
import { supabase } from '@/shared/api/supabase';
import type { Client, ClientSummary, CreateClientDto, UpdateClientDto } from '../model/types';

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

/** Moves `mergeId`'s visits and sales to `keepId`, fills its gaps, deletes `mergeId`. */
export async function mergeClients(keepId: string, mergeId: string): Promise<void> {
  const { error } = await supabase.rpc('merge_clients', { p_keep: keepId, p_merge: mergeId });
  if (error) throw error;
}

/** Visits, no-shows, money and the next booking of every client of the caller. */
export async function listClientSummaries(): Promise<ClientSummary[]> {
  const { data, error } = await supabase.rpc('client_summaries');
  if (error) throw error;
  return data.map((row) => ({
    clientId: row.client_id,
    visits: row.visits,
    noShows: row.no_shows,
    firstVisit: row.first_visit ?? null,
    lastVisit: row.last_visit ?? null,
    nextVisit: row.next_visit ?? null,
    spent: Number(row.spent),
  }));
}

/** RESTRICT: throws 23503 (→ has_related_records) if the client has appointments. */
export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('client').delete().eq('id', id);
  if (error) throw error;
}
