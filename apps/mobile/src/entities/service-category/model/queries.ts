/**
 * Service-category query + mutation hooks. Components call these, never the api, and
 * pass the master's `userId` (obtained via `useUserId()` in the widget/feature — an
 * entity may not import a sibling entity). Invalidation runs on `onSettled`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createServiceCategory,
  deleteServiceCategory,
  listServiceCategories,
  reorderServiceCategories,
  updateServiceCategory,
} from '../api/service-category.api';
import type { CreateServiceCategoryDto, ServiceCategory, UpdateServiceCategoryDto } from './types';

export const serviceCategoryKeys = {
  all: (userId: string) => ['service-categories', userId] as const,
};

export function useServiceCategoriesQuery(userId: string) {
  return useQuery({
    queryKey: serviceCategoryKeys.all(userId),
    queryFn: () => listServiceCategories(userId),
    enabled: !!userId,
  });
}

export function useCreateServiceCategoryMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateServiceCategoryDto) => createServiceCategory(userId, dto),
    onSettled: () => qc.invalidateQueries({ queryKey: serviceCategoryKeys.all(userId) }),
  });
}

export function useUpdateServiceCategoryMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateServiceCategoryDto) => updateServiceCategory(dto),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: serviceCategoryKeys.all(userId) });
      // Services carry the category's name. Keyed inline, as in the delete mutation below.
      qc.invalidateQueries({ queryKey: ['services', userId] });
    },
  });
}

export function useDeleteServiceCategoryMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteServiceCategory(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: serviceCategoryKeys.all(userId) });
      // Deleting a category nulls service.category_id — refresh services too. Keyed
      // inline to avoid a sideways entity→entity import (mirrors serviceKeys.all).
      qc.invalidateQueries({ queryKey: ['services', userId] });
    },
  });
}

/** The new order shows at once: the dragged rows must not jump back while it saves. */
export function useReorderServiceCategoriesMutation(userId: string) {
  const qc = useQueryClient();
  const key = serviceCategoryKeys.all(userId);
  return useMutation({
    mutationFn: (ids: string[]) => reorderServiceCategories(ids),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ServiceCategory[]>(key);
      qc.setQueryData<ServiceCategory[]>(key, (current) =>
        current?.map((category) => {
          const index = ids.indexOf(category.id);
          return index < 0 ? category : { ...category, sort_order: index + 1 };
        }),
      );
      return { previous };
    },
    onError: (_error, _ids, context) => qc.setQueryData(key, context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
