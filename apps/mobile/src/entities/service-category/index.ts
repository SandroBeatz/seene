/** Service-category entity — public barrel. */
export {
  serviceCategoryKeys,
  useServiceCategoriesQuery,
  useCreateServiceCategoryMutation,
  useUpdateServiceCategoryMutation,
  useDeleteServiceCategoryMutation,
  useReorderServiceCategoriesMutation,
} from './model/queries';
export type {
  ServiceCategory,
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
} from './model/types';
