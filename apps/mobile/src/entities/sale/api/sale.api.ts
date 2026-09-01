/**
 * Sale api — the only supabase import site for this entity. Read-only in Phase 2 (sales
 * are written by the `complete_appointment` RPC in Phase 3). Owner-scoped by RLS.
 */
import { supabase } from '@/shared/api/supabase';
import type { Sale } from '../model/types';

const SELECT_WITH_RELATIONS = '*, payment_type:payment_type(name, color), items:sale_item(*)';

/** The single sale for a completed appointment (its `appointment_id` is UNIQUE), or null. */
export async function getSaleByAppointment(appointmentId: string): Promise<Sale | null> {
  const { data, error } = await supabase
    .from('sale')
    .select(SELECT_WITH_RELATIONS)
    .eq('appointment_id', appointmentId)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Sale | null) ?? null;
}
