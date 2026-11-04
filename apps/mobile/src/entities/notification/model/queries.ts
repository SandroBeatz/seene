/** Notification query hooks. The feed is refetched: there is no live channel yet. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteNotification,
  deleteReadNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notification.api';
import type { Notification } from './types';

const REFRESH_MS = 60_000;

export const notificationKeys = {
  all: (userId: string) => ['notifications', userId] as const,
};

export function useNotificationsQuery(userId: string) {
  return useQuery({
    queryKey: notificationKeys.all(userId),
    queryFn: () => listNotifications(userId),
    enabled: !!userId,
    refetchInterval: REFRESH_MS,
  });
}

export function useUnreadNotificationsCount(userId: string): number {
  return (useNotificationsQuery(userId).data ?? []).filter((n) => !n.read_at).length;
}

function useOptimisticRead<V>(
  userId: string,
  mutationFn: (variables: V) => Promise<void>,
  isTarget: (row: Notification, variables: V) => boolean,
) {
  const qc = useQueryClient();
  const key = notificationKeys.all(userId);
  return useMutation({
    mutationFn,
    onMutate: async (variables: V) => {
      await qc.cancelQueries({ queryKey: key });
      const before = qc.getQueryData<Notification[]>(key);
      const now = new Date().toISOString();
      qc.setQueryData<Notification[]>(key, (rows) =>
        rows?.map((row) =>
          !row.read_at && isTarget(row, variables) ? { ...row, read_at: now } : row,
        ),
      );
      return { before };
    },
    onError: (_error, _variables, context) => qc.setQueryData(key, context?.before),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export const useMarkNotificationReadMutation = (userId: string) =>
  useOptimisticRead<string>(userId, markNotificationRead, (row, id) => row.id === id);

export const useMarkAllNotificationsReadMutation = (userId: string) =>
  useOptimisticRead<void>(
    userId,
    () => markAllNotificationsRead(userId),
    () => true,
  );

export function useDeleteNotificationMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSettled: () => qc.invalidateQueries({ queryKey: notificationKeys.all(userId) }),
  });
}

export function useDeleteReadNotificationsMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteReadNotifications(userId),
    onSettled: () => qc.invalidateQueries({ queryKey: notificationKeys.all(userId) }),
  });
}
