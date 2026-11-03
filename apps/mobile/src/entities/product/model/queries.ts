/**
 * Product hooks. A restock can add an expense, so saving also refreshes `['expenses', userId]`
 * and `['analytics', userId]`: this entity can't import those.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteProduct, getProducts, saveProduct } from '../api/product.api';
import type { SaveProductDto } from './types';

export const productKeys = {
  all: (userId: string) => ['products', userId] as const,
};

export function useProductsQuery(userId: string) {
  return useQuery({
    queryKey: productKeys.all(userId),
    queryFn: () => getProducts(userId),
    enabled: !!userId,
    // Finishing or deleting a visit moves the stock from elsewhere in the app.
    refetchOnMount: 'always',
  });
}

export function useSaveProductMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SaveProductDto) => saveProduct(dto),
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: productKeys.all(userId) }),
        qc.invalidateQueries({ queryKey: ['expenses', userId] }),
        qc.invalidateQueries({ queryKey: ['analytics', userId] }),
      ]),
  });
}

export function useDeleteProductMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSettled: () => qc.invalidateQueries({ queryKey: productKeys.all(userId) }),
  });
}
