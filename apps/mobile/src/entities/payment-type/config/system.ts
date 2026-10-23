/**
 * System payment types seeded per master (cash + card). `ensureSystemPaymentTypes`
 * inserts any that are missing. Names are canonical English; the UI may relabel by
 * `kind`. Custom methods are master-created and are never seeded here.
 */
import type { PaymentTypeKind } from '../model/types';

export interface SystemPaymentTypeSeed {
  kind: Exclude<PaymentTypeKind, 'custom'>;
  name: string;
  color: string;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
}

export const SYSTEM_PAYMENT_TYPES: readonly SystemPaymentTypeSeed[] = [
  { kind: 'cash', name: 'Cash', color: '#34d399', is_default: true, is_active: true, sort_order: 0 },
  { kind: 'card', name: 'Card', color: '#60a5fa', is_default: false, is_active: true, sort_order: 1 },
];
