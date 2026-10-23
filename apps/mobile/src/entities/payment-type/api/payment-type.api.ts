/**
 * Payment-type api — the only supabase import site for this entity. Owner-scoped by
 * RLS. Deleting a method SET NULLs `sale.payment_type_id`, so historical sales survive.
 */
import { supabase } from '@/shared/api/supabase';
import { SYSTEM_PAYMENT_TYPES } from '../config/system';
import type { CreatePaymentTypeDto, PaymentType, UpdatePaymentTypeDto } from '../model/types';

export async function listPaymentTypes(userId: string): Promise<PaymentType[]> {
  const { data, error } = await supabase
    .from('payment_type')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order')
    .order('name');
  if (error) throw error;
  return data as PaymentType[];
}

/**
 * Insert any missing system methods (cash/card) for this master. Idempotent: reads the
 * existing kinds first and only inserts the gap, so it is safe to call on every launch.
 */
export async function ensureSystemPaymentTypes(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('payment_type')
    .select('kind')
    .eq('user_id', userId);
  if (error) throw error;

  const existing = new Set((data ?? []).map((row) => row.kind));
  const missing = SYSTEM_PAYMENT_TYPES.filter((seed) => !existing.has(seed.kind));
  if (missing.length === 0) return;

  const { error: insertError } = await supabase
    .from('payment_type')
    .insert(missing.map((seed) => ({ ...seed, user_id: userId })));
  if (insertError) throw insertError;
}

export async function createCustomPaymentType(
  userId: string,
  dto: CreatePaymentTypeDto,
): Promise<PaymentType> {
  const { data, error } = await supabase
    .from('payment_type')
    .insert({ ...dto, kind: 'custom', user_id: userId })
    .select('*')
    .single();
  if (error) throw error;
  return data as PaymentType;
}

export async function updatePaymentType(dto: UpdatePaymentTypeDto): Promise<PaymentType> {
  const { id, ...patch } = dto;
  const { data, error } = await supabase
    .from('payment_type')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as PaymentType;
}

/** Hot toggle backing the optimistic active switch. */
export async function setPaymentTypeActive(id: string, isActive: boolean): Promise<PaymentType> {
  const { data, error } = await supabase
    .from('payment_type')
    .update({ is_active: isActive })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as PaymentType;
}

export async function deletePaymentType(id: string): Promise<void> {
  const { error } = await supabase.from('payment_type').delete().eq('id', id);
  if (error) throw error;
}
