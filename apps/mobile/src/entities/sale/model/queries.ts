/** Sale query hooks (read-only in Phase 2). */
import { useQuery } from '@tanstack/react-query';
import { getSaleByAppointment } from '../api/sale.api';

export const saleKeys = {
  byAppointment: (appointmentId: string) => ['sale-by-appointment', appointmentId] as const,
};

export function useSaleByAppointmentQuery(appointmentId: string | undefined) {
  return useQuery({
    queryKey: saleKeys.byAppointment(appointmentId ?? ''),
    queryFn: () => getSaleByAppointment(appointmentId!),
    enabled: !!appointmentId,
  });
}
