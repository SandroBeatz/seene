/**
 * Time-block query + mutation hooks. Callers pass the master's `userId`. A write shifts
 * unavailability on the calendar, so mutations invalidate the block ranges and the
 * calendar day counts on `onSettled`.
 */
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTimeBlock,
  deleteTimeBlock,
  getTimeBlock,
  listDaysOff,
  listTimeBlocksByRange,
  updateTimeBlock,
} from '../api/time-block.api';
import type { CreateTimeBlockDto, UpdateTimeBlockDto } from './types';

export const timeBlockKeys = {
  all: (userId: string) => ['time-blocks', userId] as const,
  range: (userId: string, from: string, to: string) => ['time-blocks', userId, from, to] as const,
  detail: (userId: string, id: string) => ['time-blocks', userId, 'detail', id] as const,
};

function invalidateTimeBlockCaches(qc: ReturnType<typeof useQueryClient>, userId: string): void {
  qc.invalidateQueries({ queryKey: timeBlockKeys.all(userId) });
  qc.invalidateQueries({ queryKey: ['appointment-day-counts', userId] });
}

export function useTimeBlocksRangeQuery(userId: string, from: string, to: string) {
  return useQuery({
    queryKey: timeBlockKeys.range(userId, from, to),
    queryFn: () => listTimeBlocksByRange(userId, from, to),
    enabled: !!userId && !!from && !!to,
  });
}

/**
 * Several ranges at once, each cached on its own. A block spanning two ranges comes
 * back once: only the first range keeps it.
 */
export function useTimeBlocksRangesQuery(
  userId: string,
  ranges: readonly { start: string; end: string }[],
) {
  return useQueries({
    queries: ranges.map(({ start, end }) => ({
      queryKey: timeBlockKeys.range(userId, start, end),
      queryFn: () => listTimeBlocksByRange(userId, start, end),
      enabled: !!userId,
    })),
    combine: (results) => {
      const byId = new Map(results.flatMap((r) => r.data ?? []).map((b) => [b.id, b]));
      return {
        data: [...byId.values()],
        isPending: results.some((r) => r.isPending),
        error: results.find((r) => r.isError)?.error ?? null,
        refetch: () => Promise.all(results.map((r) => r.refetch())),
      };
    },
  });
}

/** "Выходные и отпуск": `fromIso` is fixed by the caller, so the key doesn't tick. */
export function useDaysOffQuery(userId: string, fromIso: string) {
  return useQuery({
    queryKey: [...timeBlockKeys.all(userId), 'days-off', fromIso],
    queryFn: () => listDaysOff(userId, fromIso),
    enabled: !!userId && !!fromIso,
  });
}

export function useTimeBlockQuery(userId: string, id: string | undefined) {
  return useQuery({
    queryKey: timeBlockKeys.detail(userId, id ?? ''),
    queryFn: () => getTimeBlock(id!),
    enabled: !!userId && !!id,
  });
}

export function useCreateTimeBlockMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTimeBlockDto) => createTimeBlock(userId, dto),
    onSettled: () => invalidateTimeBlockCaches(qc, userId),
  });
}

export function useUpdateTimeBlockMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateTimeBlockDto) => updateTimeBlock(dto),
    onSettled: () => invalidateTimeBlockCaches(qc, userId),
  });
}

export function useDeleteTimeBlockMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTimeBlock(id),
    onSettled: () => invalidateTimeBlockCaches(qc, userId),
  });
}
