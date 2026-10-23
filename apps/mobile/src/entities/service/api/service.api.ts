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

/** Hot toggle backing the optimistic active switch in the services list. */
export async function setServiceActive(id: string, isActive: boolean): Promise<Service> {
  const { data, error } = await supabase
    .from('service')
    .update({ is_active: isActive })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from('service').delete().eq('id', id);
  if (error) throw error;
}
