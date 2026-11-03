/**
 * Service api — the only supabase import site for this entity.
 * RLS note: `service` has a public `SELECT USING (true)` policy, so every read MUST
 * filter `.eq('user_id', userId)`. Writes are owner-scoped by RLS.
 */
import { supabase } from '@/shared/api/supabase';
import { DEFAULT_SERVICE_COLOR } from '@/shared/config/palettes';
import type { CreateServiceDto, Service, ServiceWithCategory, UpdateServiceDto } from '../model/types';

const SELECT_WITH_CATEGORY = '*, category:service_category(id, name)';

export async function listServices(userId: string): Promise<ServiceWithCategory[]> {
  const { data, error } = await supabase
    .from('service')
    .select(SELECT_WITH_CATEGORY)
    .eq('user_id', userId)
    .order('sort_order')
    .order('name');
  if (error) throw error;
  return data as unknown as ServiceWithCategory[];
}

export async function createService(userId: string, dto: CreateServiceDto): Promise<Service> {
  const { data, error } = await supabase
    .from('service')
    .insert({ color: DEFAULT_SERVICE_COLOR, ...dto, user_id: userId })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateService(dto: UpdateServiceDto): Promise<Service> {
  const { id, ...patch } = dto;
  const { data, error } = await supabase
    .from('service')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/**
 * "Удалить": past visits refer to services by id with no foreign key and read their names
 * from here, so the row stays, out of every list and off the booking page.
 */
export async function archiveService(id: string): Promise<void> {
  const { error } = await supabase
    .from('service')
    .update({ is_active: false, show_online: false })
    .eq('id', id);
  if (error) throw error;
}

/** Writes the order of the listed services, numbered from 1. */
export async function reorderServices(ids: string[]): Promise<void> {
  const { error } = await supabase.rpc('reorder_services', { p_ids: ids });
  if (error) throw error;
}
