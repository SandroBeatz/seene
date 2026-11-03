/** Product entity — public barrel. */
export {
  linkedSummary,
  linksOfService,
  linksValid,
  parseQuantity,
  sameLinks,
} from './lib/quantity';
export {
  contentUnitCost,
  filterProducts,
  fromPackages,
  isLowStock,
  rebaseAmount,
  stockDelta,
  toPackages,
  type TypeFilter,
} from './lib/stock';
export { createLinksStore } from './model/links.store';
export {
  useDeleteProductMutation,
  useProductsQuery,
  useSaveProductMutation,
  useSetServiceProductsMutation,
} from './model/queries';
export {
  PRODUCT_CONTENT_UNITS,
  PRODUCT_TYPES,
  PRODUCT_UNITS,
  type Product,
  type ProductContentUnit,
  type ProductType,
  type ProductUnit,
} from './model/types';
export { QuantityLinksList } from './ui/QuantityLinksList';
export { QuantityStepper } from './ui/QuantityStepper';
