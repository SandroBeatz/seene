/** Client domain types. Row is derived from the generated DB schema. */
import type { Database } from '@/shared/api/database.types';

export type Client = Database['public']['Tables']['client']['Row'];

/** The card fields a master edits (design "Новый клиент" / "Редактировать"). */
export interface ClientCardDto {
  first_name: string;
  last_name?: string | null;
  /** Canonical E.164 digits, or null. */
  phone?: string | null;
  avatar_color?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  instagram?: string | null;
  birth_day?: number | null;
  birth_month?: number | null;
  notes?: string | null;
  is_favorite?: boolean;
}

export type CreateClientDto = ClientCardDto;
export type UpdateClientDto = Partial<ClientCardDto> & { id: string };

/** Per-client numbers (`client_summaries()`): finished visits, money, the next booking. */
export interface ClientSummary {
  clientId: string;
  visits: number;
  noShows: number;
  firstVisit: string | null;
  lastVisit: string | null;
  nextVisit: string | null;
  spent: number;
}
