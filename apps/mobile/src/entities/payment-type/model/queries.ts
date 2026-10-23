/**
 * Payment-type query + mutation hooks. Callers pass the master's `userId`. The active
 * toggle is optimistic; other writes invalidate on `onSettled`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCustomPaymentType,
  deletePaymentType,
  ensureSystemPaymentTypes,
  listPaymentTypes,
  setPaymentTypeActive,
  updatePaymentType,
} from '../api/payment-type.api';
import type { CreatePaymentTypeDto, PaymentType, UpdatePaymentTypeDto } from './types';

export const paymentTypeKeys = {
  all: (userId: string) => ['payment-types', userId] as const,
};

export function usePaymentTypesQuery(userId: string) {
  return useQuery({
    queryKey: paymentTypeKeys.all(userId),
    queryFn: () => listPaymentTypes(userId),
    enabled: !!userId,
  });
}

/** Seed cash/card if missing (idempotent) — run once when payment settings mount. */
export function useEnsureSystemPaymentTypesMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => ensureSystemPaymentTypes(userId),
    onSettled: () => qc.invalidateQueries({ queryKey: paymentTypeKeys.all(userId) }),
  });
}

export function useCreatePaymentTypeMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePaymentTypeDto) => createCustomPaymentType(userId, dto),
    onSettled: () => qc.invalidateQueries({ queryKey: paymentTypeKeys.all(userId) }),
  });
}

export function useUpdatePaymentTypeMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdatePaymentTypeDto) => updatePaymentType(dto),
    onSettled: () => qc.invalidateQueries({ queryKey: paymentTypeKeys.all(userId) }),
  });
}

export function useDeletePaymentTypeMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePaymentType(id),
    onSettled: () => qc.invalidateQueries({ queryKey: paymentTypeKeys.all(userId) }),
  });
}

export function useTogglePaymentTypeActiveMutation(userId: string) {
  const qc = useQueryClient();
  const key = paymentTypeKeys.all(userId);
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setPaymentTypeActive(id, isActive),
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<PaymentType[]>(key);
      if (previous) {
        qc.setQueryData<PaymentType[]>(
          key,
          previous.map((pt) => (pt.id === id ? { ...pt, is_active: isActive } : pt)),
        );
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
