/** Time-block domain types. Row is derived from the generated DB schema. */
import type { Database } from '@/shared/api/database.types';

export type TimeBlock = Database['public']['Tables']['time_block']['Row'];

/** `personal` is "Личное время"; the others are "Выходные и отпуск". */
export type TimeBlockKind = 'personal' | 'day_off' | 'vacation';

export interface CreateTimeBlockDto {
  start_at: string; // UTC ISO
  end_at: string; // UTC ISO
  all_day?: boolean;
  notes?: string | null;
  kind?: TimeBlockKind;
  /** Whether the block closes online booking. Default true. */
  close_online?: boolean;
}

export type UpdateTimeBlockDto = Partial<CreateTimeBlockDto> & { id: string };
