/** Attention dismissal types: a closed or snoozed "Требуют внимания" card. */
import type { Database } from '@/shared/api/database.types';

export type AttentionDismissal = Database['public']['Tables']['attention_dismissal']['Row'];

export interface DismissDto {
  /** The card's key (`client_cancelled:<id>`, `recall:<client id>`, …). */
  key: string;
  /** Snoozed until (UTC ISO); null = for good. */
  until: string | null;
}
