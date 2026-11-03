/** Product entity — public barrel. */
export { isLowStock } from './lib/stock';
export {
  productKeys,
  useDeleteProductMutation,
  useProductsQuery,
  useSaveProductMutation,
} from './model/queries';
export {
  PRODUCT_TYPES,
  PRODUCT_UNITS,
  type Product,
  type ProductType,
  type ProductUnit,
  type SaveProductDto,
} from './model/types';
