/** Service entity — public barrel. */
export { SERVICE_TEMPLATES, type ServiceTemplate } from './config/templates';
export {
  serviceKeys,
  useServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useToggleServiceActiveMutation,
} from './model/queries';
export type {
  Service,
  ServiceWithCategory,
  ServiceCategoryRef,
  CreateServiceDto,
  UpdateServiceDto,
} from './model/types';
