/**
 * Sale api — the only supabase import site for this entity. Sales are written only by
 * the `complete_appointment` RPC (checkout). Owner-scoped by RLS.
 */
import { supabase } from '@/shared/api/supabase';
import type { CompleteAppointmentDto, Sale, SaleAmount } from '../model/types';

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

/** Paid amounts whose `paid_at` (= the visit's start) falls in [from, to). */
export async function listSaleAmountsByRange(
  userId: string,
  from: string,
  to: string,
): Promise<SaleAmount[]> {
  const { data, error } = await supabase
    .from('sale')
    .select('appointment_id, amount')
    .eq('user_id', userId)
    .gte('paid_at', from)
    .lt('paid_at', to);
  if (error) throw error;
  return data;
}

/**
 * Check out a visit in one transaction: status → completed, the actual time if given,
 * the sale and its lines. Returns the sale id. Fails with `already_completed` on a
 * repeated tap.
 */
export async function completeAppointment(dto: CompleteAppointmentDto): Promise<string> {
  const { data, error } = await supabase.rpc('complete_appointment', {
    p_appointment_id: dto.appointmentId,
    p_amount: dto.amount,
    // The RPC accepts null (no method); the generated type does not say so.
    p_payment_type_id: dto.paymentTypeId as string,
    p_items: dto.items,
    p_start_at: dto.startAt ?? undefined,
    p_duration: dto.duration ?? undefined,
  });
  if (error) throw error;
  return data;
}
