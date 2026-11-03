/** Product entity — public barrel. */
export {
  linkedSummary,
  linksOfService,
  parseQuantity,
  sameLinks,
  stepQuantity,
} from './lib/quantity';
export { isLowStock } from './lib/stock';
export { createLinksStore } from './model/links.store';
export {
  productKeys,
  useDeleteProductMutation,
  useProductsQuery,
  useSaveProductMutation,
  useSetServiceProductsMutation,
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
export { QuantityLinksList } from './ui/QuantityLinksList';
export { QuantityStepper } from './ui/QuantityStepper';
