/** Payment-type domain types. Row `kind` is narrowed to the fixed union. */
import type { Database } from '@/shared/api/database.types';

type PaymentTypeRow = Database['public']['Tables']['payment_type']['Row'];

export type PaymentTypeKind = 'cash' | 'card' | 'custom';

export interface PaymentType extends Omit<PaymentTypeRow, 'kind'> {
  kind: PaymentTypeKind;
}

/** Only custom methods are created by masters; system ones are seeded. */
export interface CreatePaymentTypeDto {
  name: string;
  color?: string;
  sort_order?: number;
}

export type UpdatePaymentTypeDto = Partial<
  Pick<PaymentType, 'name' | 'color' | 'sort_order' | 'is_active' | 'is_default'>
> & { id: string };
