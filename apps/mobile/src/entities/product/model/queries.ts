/**
 * Product hooks. A purchase can add an expense, so it also refreshes `['expenses', userId]` and
 * `['analytics', userId]`: this entity can't import those. Finishing and deleting a visit move
 * the stock, and refresh `['products', userId]` the same way.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteProduct,
  getProducts,
  getPurchases,
  restockProduct,
  saveProduct,
  setServiceProducts,
} from '../api/product.api';
import type { RestockProductDto, SaveProductDto } from './types';

export const productKeys = {
  all: (userId: string) => ['products', userId] as const,
};

export function useProductsQuery(userId: string) {
  return useQuery({
    queryKey: productKeys.all(userId),
    queryFn: () => getProducts(userId),
    enabled: !!userId,
  });
}

export function useSaveProductMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SaveProductDto) => saveProduct(dto),
    onSettled: () => qc.invalidateQueries({ queryKey: productKeys.all(userId) }),
  });
}

export function useRestockProductMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: RestockProductDto) => restockProduct(dto),
    onSettled: () => {
      // The sheet doesn't wait for these two.
      void qc.invalidateQueries({ queryKey: ['expenses', userId] });
      void qc.invalidateQueries({ queryKey: ['analytics', userId] });
      return qc.invalidateQueries({ queryKey: productKeys.all(userId) });
    },
  });
}

/** Under the products key: whatever moves the stock refreshes these too. */
export function useProductPurchasesQuery(userId: string, from: string) {
  return useQuery({
    queryKey: [...productKeys.all(userId), 'purchases', from],
    queryFn: () => getPurchases(userId, from),
    enabled: !!userId,
  });
}

export function useSetServiceProductsMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { serviceId: string; links: { product_id: string; quantity: number }[] }) =>
      setServiceProducts(input.serviceId, input.links),
    onSettled: () => qc.invalidateQueries({ queryKey: productKeys.all(userId) }),
  });
}

export function useDeleteProductMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSettled: () => qc.invalidateQueries({ queryKey: productKeys.all(userId) }),
  });
}
