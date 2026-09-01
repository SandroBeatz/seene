/** Time-block domain types. Row is derived from the generated DB schema. */
import type { Database } from '@/shared/api/database.types';

export type TimeBlock = Database['public']['Tables']['time_block']['Row'];

export interface CreateTimeBlockDto {
  start_at: string; // UTC ISO
  end_at: string; // UTC ISO
  all_day?: boolean;
  notes?: string | null;
}

export type UpdateTimeBlockDto = Partial<CreateTimeBlockDto> & { id: string };
