/** Product api. Saving goes through one RPC: the stock moves together with its history. */
import { supabase } from '@/shared/api/supabase';
import type { Product, RestockProductDto, SaveProductDto } from '../model/types';

export async function getProducts(userId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('product')
    .select('*, services:product_service(service_id, quantity)')
    .eq('user_id', userId)
    .order('name');
  if (error) throw error;
  return data as Product[];
}

export async function saveProduct(dto: SaveProductDto): Promise<string> {
  const { data, error } = await supabase.rpc('save_product', {
    p_id: dto.id,
    p_name: dto.name,
    p_type: dto.type,
    p_unit: dto.unit,
    p_stock_delta: dto.stockDelta,
    p_low_stock: dto.lowStock,
    p_pack_size: dto.packSize,
    p_content_unit: dto.contentUnit ?? undefined,
    p_buy_price: dto.buyPrice ?? undefined,
    p_sell_price: dto.sellPrice ?? undefined,
    p_services: dto.services,
  });
  if (error) throw error;
  return data;
}

export async function restockProduct(dto: RestockProductDto): Promise<void> {
  const { error } = await supabase.rpc('restock_product', {
    p_id: dto.id,
    p_quantity: dto.quantity,
    p_total: dto.total ?? undefined,
    p_to_expense: dto.toExpense,
    p_today: dto.today,
  });
  if (error) throw error;
}

/** Purchases since a moment: what the screen's month numbers add up. */
export async function getPurchases(
  userId: string,
  from: string,
): Promise<{ amount: number | null; created_at: string }[]> {
  const { data, error } = await supabase
    .from('stock_movement')
    .select('amount, created_at')
    .eq('user_id', userId)
    .eq('reason', 'restock')
    .gte('created_at', from);
  if (error) throw error;
  return data;
}

export async function setServiceProducts(
  serviceId: string,
  links: { product_id: string; quantity: number }[],
): Promise<void> {
  const { error } = await supabase.rpc('set_service_products', {
    p_service_id: serviceId,
    p_products: links,
  });
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('product').delete().eq('id', id);
  if (error) throw error;
}
