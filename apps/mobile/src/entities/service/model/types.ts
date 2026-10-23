/**
 * Service domain types. Row is derived from the generated DB schema. The joined
 * category is modelled as a minimal inline ref (not an import from the
 * service-category entity) to respect the same-slice-only import boundary.
 */
import type { Database } from '@/shared/api/database.types';

export type Service = Database['public']['Tables']['service']['Row'];

export interface ServiceCategoryRef {
  id: string;
  name: string;
}

export interface ServiceWithCategory extends Service {
  category: ServiceCategoryRef | null;
}

export interface CreateServiceDto {
  name: string;
  category_id?: string | null;
  description?: string | null;
  duration: number;
  price: number;
  color?: string;
  is_active?: boolean;
  sort_order?: number;
}

export type UpdateServiceDto = Partial<CreateServiceDto> & { id: string };
