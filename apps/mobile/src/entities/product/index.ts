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
  PRODUCT_CONTENT_UNITS,
  PRODUCT_UNITS,
  type Product,
  type ProductType,
  type ProductContentUnit,
  type ProductUnit,
  type SaveProductDto,
} from './model/types';
