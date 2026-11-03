import type { Tables } from '@/shared/api/database.types';

export type Product = Tables<'product'> & {
  services: { service_id: string; quantity: number }[];
};

export const PRODUCT_TYPES = ['work', 'sale'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

/** What it is counted in on the shelf. */
export const PRODUCT_UNITS = ['pcs', 'bottle', 'pack'] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

/** What it is used in, when a package is used in parts. */
export const PRODUCT_CONTENT_UNITS = ['ml', 'g'] as const;
export type ProductContentUnit = (typeof PRODUCT_CONTENT_UNITS)[number];

export interface SaveProductDto {
  id?: string;
  name: string;
  type: ProductType;
  unit: ProductUnit;
  /** A change, not a value: a visit may come off the stock while the form is open. */
  stockDelta: number;
  lowStock: number;
  /** Set when a package is used in parts. Stock, threshold and links are then in this unit. */
  contentUnit: ProductContentUnit | null;
  /** What one package holds, in `contentUnit`. 1 without it. */
  packSize: number;
  buyPrice: number | null;
  sellPrice: number | null;
  expenseOnRestock: boolean;
  services: { service_id: string; quantity: number }[];
  /** The master's day, for the restock's expense. */
  today: string;
}
