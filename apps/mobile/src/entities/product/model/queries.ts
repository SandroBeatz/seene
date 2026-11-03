/**
 * Product hooks. A restock can add an expense, so saving one also refreshes
 * `['expenses', userId]` and `['analytics', userId]`: this entity can't import those. Finishing
 * and deleting a visit move the stock, and refresh `['products', userId]` the same way.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteProduct, getProducts, saveProduct, setServiceProducts } from '../api/product.api';
import type { SaveProductDto } from './types';

const productKeys = {
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
    onSettled: (_id, _error, dto) => {
      // Only what save_product can write an expense for; the sheet doesn't wait for these.
      if (dto.id && dto.expenseOnRestock && dto.stockDelta > 0 && dto.buyPrice) {
        void qc.invalidateQueries({ queryKey: ['expenses', userId] });
        void qc.invalidateQueries({ queryKey: ['analytics', userId] });
      }
      return qc.invalidateQueries({ queryKey: productKeys.all(userId) });
    },
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
