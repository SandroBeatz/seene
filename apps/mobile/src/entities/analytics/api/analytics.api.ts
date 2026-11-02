/** Analytics api — the only supabase import site for this entity. Auth-scoped RPCs. */
import { supabase } from '@/shared/api/supabase';
import type {
  MoneyOverview,
  MoneyOverviewParams,
  PeriodClient,
  SaleOperation,
} from '../model/types';

export async function getMoneyOverview(params: MoneyOverviewParams): Promise<MoneyOverview> {
  const { data, error } = await supabase.rpc('get_money_overview', {
    p_from: params.from,
    p_to: params.to,
    p_prev_from: params.prevFrom,
    p_prev_to: params.prevTo,
    p_granularity: params.granularity,
    p_tz: params.zone,
  });
  if (error) throw error;
  return data as unknown as MoneyOverview;
}

export async function getMoneyClients(from: string, to: string): Promise<PeriodClient[]> {
  const { data, error } = await supabase.rpc('get_money_clients', { p_from: from, p_to: to });
  if (error) throw error;
  return data as PeriodClient[];
}

export async function listSaleOperations(
  userId: string,
  from: string,
  to: string,
): Promise<SaleOperation[]> {
  const { data, error } = await supabase
    .from('sale')
    .select(
      'id, appointment_id, amount, tip, paid_at, client:client(first_name, last_name, avatar_color), payment_type:payment_type(kind, name), items:sale_item(name_snapshot)',
    )
    .eq('user_id', userId)
    .gte('paid_at', from)
    .lt('paid_at', to)
    .order('paid_at', { ascending: false });
  if (error) throw error;
  return data as SaleOperation[];
}
