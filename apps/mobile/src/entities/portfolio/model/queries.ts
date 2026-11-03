import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addPortfolioPhoto,
  deletePortfolioItem,
  getPortfolio,
  reorderPortfolio,
  updatePortfolioItem,
} from '../api/portfolio.api';
import { nextPortfolioOrder } from '../lib/storage';
import type { PortfolioItem, PortfolioItemPatch } from './types';

export const portfolioKeys = {
  all: (userId: string) => ['portfolio', userId] as const,
};

export function usePortfolioQuery(userId: string) {
  return useQuery({
    queryKey: portfolioKeys.all(userId),
    queryFn: () => getPortfolio(userId),
    enabled: !!userId,
  });
}

/** One by one, so a failure keeps the photos already saved; they appear as they land. */
export function useAddPortfolioPhotosMutation(userId: string) {
  const qc = useQueryClient();
  const key = portfolioKeys.all(userId);
  return useMutation({
    mutationFn: async (files: { uri: string; mimeType: string }[]) => {
      let order = nextPortfolioOrder(qc.getQueryData<PortfolioItem[]>(key) ?? []);
      for (const file of files) {
        await addPortfolioPhoto(userId, file, order);
        order += 1;
        await qc.invalidateQueries({ queryKey: key });
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useUpdatePortfolioItemMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: PortfolioItemPatch }) =>
      updatePortfolioItem(id, patch),
    onSettled: () => qc.invalidateQueries({ queryKey: portfolioKeys.all(userId) }),
  });
}

export function useDeletePortfolioItemMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (item: PortfolioItem) => deletePortfolioItem(item),
    onSettled: () => qc.invalidateQueries({ queryKey: portfolioKeys.all(userId) }),
  });
}

/** The new order shows at once: dragged photos must not jump back while it saves. */
export function useReorderPortfolioMutation(userId: string) {
  const qc = useQueryClient();
  const key = portfolioKeys.all(userId);
  return useMutation({
    mutationFn: (ids: string[]) => reorderPortfolio(ids),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<PortfolioItem[]>(key);
      if (previous) {
        const byId = new Map(previous.map((item) => [item.id, item]));
        qc.setQueryData(
          key,
          ids.flatMap((id, index) => {
            const item = byId.get(id);
            return item ? [{ ...item, sort_order: index + 1 }] : [];
          }),
        );
      }
      return { previous };
    },
    onError: (_error, _ids, context) => qc.setQueryData(key, context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
