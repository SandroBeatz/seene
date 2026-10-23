/** Pure payment-type helpers. */
import type { PaymentType } from '../model/types';

/** System methods (cash/card) are non-deletable/renamable in the UI; custom ones aren't. */
export function isSystemPaymentType(pt: Pick<PaymentType, 'kind'>): boolean {
  return pt.kind !== 'custom';
}
