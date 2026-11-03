/**
 * Service query + mutation hooks. Components call these, never the api, and pass the
 * master's `userId` (an entity may not import a sibling entity, so the widget/feature
 * resolves it via `useUserId()`). Reordering updates the cache optimistically; everything
 * else invalidates on `onSettled`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  archiveService,
  createService,
  listServices,
  reorderServices,
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

export function useArchiveServiceMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveService(id),
    onSettled: () => qc.invalidateQueries({ queryKey: serviceKeys.all(userId) }),
  });
}

/** The new order shows at once: the dragged rows must not jump back while it saves. */
export function useReorderServicesMutation(userId: string) {
  const qc = useQueryClient();
  const key = serviceKeys.all(userId);
  return useMutation({
    mutationFn: (ids: string[]) => reorderServices(ids),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ServiceWithCategory[]>(key);
      qc.setQueryData<ServiceWithCategory[]>(key, (current) =>
        current?.map((service) => {
          const index = ids.indexOf(service.id);
          return index < 0 ? service : { ...service, sort_order: index + 1 };
        }),
      );
      return { previous };
    },
    onError: (_error, _ids, context) => qc.setQueryData(key, context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
