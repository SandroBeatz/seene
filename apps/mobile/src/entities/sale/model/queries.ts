/** Sale query hooks and the checkout mutation. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  completeAppointment,
  getSaleByAppointment,
  listSaleAmountsByRange,
} from '../api/sale.api';
import type { CompleteAppointmentDto } from './types';

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

/**
 * Checkout. Invalidates the sale caches; the caller also refreshes the appointment
 * caches (another entity) in `onSettled`.
 */
export function useCompleteAppointmentMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CompleteAppointmentDto) => completeAppointment(dto),
    onSettled: (_id, _error, dto) => {
      qc.invalidateQueries({ queryKey: saleKeys.all(userId) });
      qc.invalidateQueries({ queryKey: saleKeys.byAppointment(dto.appointmentId) });
    },
  });
}
