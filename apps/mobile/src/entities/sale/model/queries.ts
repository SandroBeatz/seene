/** Sale query hooks (read-only in Phase 2). */
import { useQuery } from '@tanstack/react-query';
import { getSaleByAppointment, listSaleAmountsByRange } from '../api/sale.api';

export const saleKeys = {
  byAppointment: (appointmentId: string) => ['sale-by-appointment', appointmentId] as const,
  /** Prefix for every range query — invalidate after a checkout. */
  all: (userId: string) => ['sales', userId] as const,
  range: (userId: string, from: string, to: string) => ['sales', userId, from, to] as const,
};

/** Paid amount per appointment for visits in [from, to). */
export function useSaleAmountsRangeQuery(userId: string, from: string, to: string) {
  return useQuery({
    queryKey: saleKeys.range(userId, from, to),
    queryFn: () => listSaleAmountsByRange(userId, from, to),
    enabled: !!userId && !!from && !!to,
  });
}

export function useSaleByAppointmentQuery(appointmentId: string | undefined) {
  return useQuery({
    queryKey: saleKeys.byAppointment(appointmentId ?? ''),
    queryFn: () => getSaleByAppointment(appointmentId!),
    enabled: !!appointmentId,
  });
}
