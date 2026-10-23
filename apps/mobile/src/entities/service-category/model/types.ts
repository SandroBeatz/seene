/** Service-category domain types. Row is derived from the generated DB schema. */
import type { Database } from '@/shared/api/database.types';

export type ServiceCategory = Database['public']['Tables']['service_category']['Row'];

export interface CreateServiceCategoryDto {
  name: string;
  sort_order?: number;
}

export type UpdateServiceCategoryDto = Partial<CreateServiceCategoryDto> & { id: string };
