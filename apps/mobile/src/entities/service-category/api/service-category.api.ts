/**
 * Service-category api — the only supabase import site for this entity.
 * RLS note: `service_category` carries a public `SELECT USING (true)` policy for the
 * booking site, so every read MUST filter `.eq('user_id', userId)` or it would return
 * every master's categories. Writes are owner-scoped by RLS.
 */
import { supabase } from '@/shared/api/supabase';
import type {
  CreateServiceCategoryDto,
  ServiceCategory,
  UpdateServiceCategoryDto,
} from '../model/types';

export async function listServiceCategories(userId: string): Promise<ServiceCategory[]> {
  const { data, error } = await supabase
    .from('service_category')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order')
    .order('name');
  if (error) throw error;
  return data;
}

export async function createServiceCategory(
  userId: string,
  dto: CreateServiceCategoryDto,
): Promise<ServiceCategory> {
  const { data, error } = await supabase
    .from('service_category')
    .insert({ ...dto, user_id: userId })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateServiceCategory(
  dto: UpdateServiceCategoryDto,
): Promise<ServiceCategory> {
  const { id, ...patch } = dto;
  const { data, error } = await supabase
    .from('service_category')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/** Deleting a category sets `service.category_id` to NULL (services survive, uncategorised). */
export async function deleteServiceCategory(id: string): Promise<void> {
  const { error } = await supabase.from('service_category').delete().eq('id', id);
  if (error) throw error;
}
