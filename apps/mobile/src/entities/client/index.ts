/** Client entity — public barrel. */
export {
  clientKeys,
  useClientsQuery,
  useClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useToggleClientFavoriteMutation,
  useClientSummariesQuery,
} from './model/queries';
export { isNewClient } from './lib/derive';
export {
  clientName,
  daysInBirthMonth,
  instagramUrl,
  isValidBirthday,
  normalizeInstagram,
  normalizeTelegram,
  telegramUrl,
} from './lib/card';
export {
  CLIENT_SEGMENTS,
  inSegment,
  matchesClientQuery,
  REGULAR_VISITS,
  type ClientSegment,
} from './lib/segments';
export { recallCandidates, recallState, type RecallState, type RecallVisit } from './lib/recall';
export type {
  Client,
  ClientCardDto,
  ClientSummary,
  CreateClientDto,
  UpdateClientDto,
} from './model/types';
