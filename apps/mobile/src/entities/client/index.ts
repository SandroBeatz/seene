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
  useMergeClientsMutation,
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
export {
  duplicateCandidates,
  duplicateReason,
  type DuplicateCandidate,
  type DuplicateReason,
} from './lib/duplicates';
export { contactToCard } from './lib/contacts';
export { recallCandidates, recallState, type RecallState, type RecallVisit } from './lib/recall';
export type {
  Client,
  ClientCardDto,
  ClientSummary,
  CreateClientDto,
  UpdateClientDto,
} from './model/types';
