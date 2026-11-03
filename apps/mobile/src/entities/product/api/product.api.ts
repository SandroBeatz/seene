/** Product api. Saving goes through one RPC: the stock moves together with its history. */
import { supabase } from '@/shared/api/supabase';
import type { Product, SaveProductDto } from '../model/types';

export async function getProducts(userId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('product')
    .select('*, services:product_service(service_id, quantity)')
    .eq('user_id', userId)
    .order('name');
  if (error) throw error;
  return data;
}

export async function saveProduct(dto: SaveProductDto): Promise<string> {
  const { data, error } = await supabase.rpc('save_product', {
    p_id: dto.id,
    p_name: dto.name,
    p_type: dto.type,
    p_unit: dto.unit,
    p_stock_delta: dto.stockDelta,
    p_low_stock: dto.lowStock,
    p_buy_price: dto.buyPrice ?? undefined,
    p_sell_price: dto.sellPrice ?? undefined,
    p_expense_on_restock: dto.expenseOnRestock,
    p_services: dto.services,
    p_today: dto.today,
  });
  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('product').delete().eq('id', id);
  if (error) throw error;
}
