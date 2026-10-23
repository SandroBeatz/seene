/** Client entity — public barrel. */
export {
  clientKeys,
  useClientsQuery,
  useClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useToggleClientFavoriteMutation,
} from './model/queries';
export { isNewClient } from './lib/derive';
export type { Client, CreateClientDto, UpdateClientDto } from './model/types';
