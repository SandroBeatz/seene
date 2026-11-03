/** Pure payment-type helpers. */
import type { PaymentType } from '../model/types';

/** System methods can't be renamed or deleted in the UI; custom ones can. */
export function isSystemPaymentType(pt: Pick<PaymentType, 'kind'>): boolean {
  return pt.kind !== 'custom';
}
