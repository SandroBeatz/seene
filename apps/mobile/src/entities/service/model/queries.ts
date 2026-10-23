/**
 * Service query + mutation hooks. Components call these, never the api, and pass the
 * master's `userId` (an entity may not import a sibling entity, so the widget/feature
 * resolves it via `useUserId()`). The active toggle updates the cache optimistically
 * (onMutate/onError); everything else invalidates on `onSettled`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createService,
  deleteService,
  listServices,
  setServiceActive,
  updateService,
} from '../api/service.api';
import type { CreateServiceDto, ServiceWithCategory, UpdateServiceDto } from './types';

export const serviceKeys = {
  all: (userId: string) => ['services', userId] as const,
};

export function useServicesQuery(userId: string) {
  return useQuery({
    queryKey: serviceKeys.all(userId),
    queryFn: () => listServices(userId),
    enabled: !!userId,
  });
}

export function useCreateServiceMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateServiceDto) => createService(userId, dto),
    onSettled: () => qc.invalidateQueries({ queryKey: serviceKeys.all(userId) }),
  });
}

export function useUpdateServiceMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateServiceDto) => updateService(dto),
    onSettled: () => qc.invalidateQueries({ queryKey: serviceKeys.all(userId) }),
  });
}

export function useDeleteServiceMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSettled: () => qc.invalidateQueries({ queryKey: serviceKeys.all(userId) }),
  });
}

export function useToggleServiceActiveMutation(userId: string) {
  const qc = useQueryClient();
  const key = serviceKeys.all(userId);
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setServiceActive(id, isActive),
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ServiceWithCategory[]>(key);
      if (previous) {
        qc.setQueryData<ServiceWithCategory[]>(
          key,
          previous.map((s) => (s.id === id ? { ...s, is_active: isActive } : s)),
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
