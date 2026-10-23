/**
 * Time-block query + mutation hooks. Callers pass the master's `userId`. A write shifts
 * unavailability on the calendar, so mutations invalidate the block ranges and the
 * calendar day counts on `onSettled`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTimeBlock,
  deleteTimeBlock,
  listTimeBlocksByRange,
  updateTimeBlock,
} from '../api/time-block.api';
import type { CreateTimeBlockDto, UpdateTimeBlockDto } from './types';

export const timeBlockKeys = {
  all: (userId: string) => ['time-blocks', userId] as const,
  range: (userId: string, from: string, to: string) =>
    ['time-blocks', userId, from, to] as const,
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
