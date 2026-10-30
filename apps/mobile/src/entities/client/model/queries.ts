/**
 * Client query + mutation hooks. Components call these and pass the master's `userId`
 * (resolved via `useUserId()` upstream — an entity may not import a sibling entity).
 * The favourite toggle is optimistic; other writes invalidate on `onSettled`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createClient,
  deleteClient,
  getClient,
  listClients,
  listClientSummaries,
  setClientFavorite,
  updateClient,
} from '../api/client.api';
import type { Client, ClientSummary, CreateClientDto, UpdateClientDto } from './types';

export const clientKeys = {
  all: (userId: string) => ['clients', userId] as const,
  detail: (id: string) => ['client', id] as const,
  /** Literal shared with the appointment entity's cache invalidation. */
  summaries: (userId: string) => ['client-summaries', userId] as const,
};

/** Every client's numbers, by client id. */
export function useClientSummariesQuery(userId: string) {
  return useQuery({
    queryKey: clientKeys.summaries(userId),
    queryFn: listClientSummaries,
    enabled: !!userId,
    select: (rows: ClientSummary[]) => new Map(rows.map((row) => [row.clientId, row])),
  });
}

export function useClientsQuery(userId: string) {
  return useQuery({
    queryKey: clientKeys.all(userId),
    queryFn: () => listClients(userId),
    enabled: !!userId,
  });
}

export function useClientQuery(clientId: string | undefined) {
  return useQuery({
    queryKey: clientKeys.detail(clientId ?? ''),
    queryFn: () => getClient(clientId!),
    enabled: !!clientId,
  });
}

export function useCreateClientMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateClientDto) => createClient(userId, dto),
    onSettled: () => qc.invalidateQueries({ queryKey: clientKeys.all(userId) }),
  });
}

export function useUpdateClientMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateClientDto) => updateClient(dto),
    onSettled: (_data, _error, dto) => {
      qc.invalidateQueries({ queryKey: clientKeys.all(userId) });
      qc.invalidateQueries({ queryKey: clientKeys.detail(dto.id) });
    },
  });
}

export function useDeleteClientMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: clientKeys.all(userId) });
      qc.invalidateQueries({ queryKey: clientKeys.summaries(userId) });
    },
  });
}

export function useToggleClientFavoriteMutation(userId: string) {
  const qc = useQueryClient();
  const key = clientKeys.all(userId);
  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      setClientFavorite(id, isFavorite),
    onMutate: async ({ id, isFavorite }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Client[]>(key);
      if (previous) {
        qc.setQueryData<Client[]>(
          key,
          previous.map((c) => (c.id === id ? { ...c, is_favorite: isFavorite } : c)),
        );
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
