/**
 * Sale domain types. A sale is created atomically by the `complete_appointment` RPC
 * (checkout). Joined `payment_type` and
 * `items` are modelled as inline shapes to respect same-slice-only imports.
 */
import type { Database } from '@/shared/api/database.types';

export type SaleRow = Database['public']['Tables']['sale']['Row'];
export type SaleItem = Database['public']['Tables']['sale_item']['Row'];

export interface PaymentTypeRef {
  name: string;
  color: string;
  kind: string;
}

export interface Sale extends SaleRow {
  payment_type: PaymentTypeRef | null;
  items: SaleItem[];
}

/** A sale reduced to what day totals need (`listSaleAmountsByRange`). */
export type SaleAmount = Pick<SaleRow, 'appointment_id' | 'amount'>;

/** Checkout input for `complete_appointment`. */
export interface CompleteAppointmentDto {
  appointmentId: string;
  amount: number;
  paymentTypeId: string | null;
  items: { service_id: string; name: string; price: number }[];
  /** Actual start (UTC ISO), or null to keep the planned one. */
  startAt: string | null;
  /** Actual length in minutes, or null to keep the planned one. */
  duration: number | null;
}

/** `update_finished_visit`: what is left out stays as it is. */
export interface UpdateFinishedVisitDto {
  appointmentId: string;
  amount?: number | null;
  paymentTypeId?: string | null;
  duration?: number | null;
  serviceIds?: string[] | null;
  items?: { service_id: string; name: string; price: number }[] | null;
}
