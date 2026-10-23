/** Client domain types. Row is derived from the generated DB schema. */
import type { Database } from '@/shared/api/database.types';

export type Client = Database['public']['Tables']['client']['Row'];

export interface CreateClientDto {
  phone: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  birthday?: string | null; // YYYY-MM-DD
  notes?: string | null;
  emoji?: string | null;
  is_favorite?: boolean;
}

export type UpdateClientDto = Partial<CreateClientDto> & { id: string };
