/**
 * Attention dismissal hooks. Dismissing is optimistic: the card leaves at once and
 * comes back only if the write fails.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dismissAttention, listActiveDismissals } from '../api/attention.api';
import type { DismissDto } from './types';

export const attentionKeys = {
  dismissed: (userId: string) => ['attention-dismissed', userId] as const,
};

export function useDismissedAttentionQuery(userId: string) {
  return useQuery({
    queryKey: attentionKeys.dismissed(userId),
    queryFn: () => listActiveDismissals(userId, new Date().toISOString()),
    enabled: !!userId,
    select: (keys) => new Set(keys),
  });
}

export function useDismissAttentionMutation(userId: string) {
  const qc = useQueryClient();
  const key = attentionKeys.dismissed(userId);
  return useMutation({
    mutationFn: (dtos: DismissDto[]) => dismissAttention(userId, dtos),
    onMutate: async (dtos) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<string[]>(key);
      qc.setQueryData<string[]>(key, [...(previous ?? []), ...dtos.map((d) => d.key)]);
      return { previous };
    },
    onError: (_error, _dtos, context) => qc.setQueryData(key, context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
