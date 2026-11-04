/**
 * What the master can do with personal time, from its preview and the schedule's
 * long-press menu: another name, another time, or delete it (with "Отменить" on the toast).
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useUserId } from '@/entities/session';
import { timeBlockKeys, useDeleteTimeBlockMutation, type TimeBlock } from '@/entities/time-block';
import type { IconName } from '@/shared/ui';
import { removeWithUndo } from '@/shared/ui';

export type TimeBlockAction = 'rename' | 'reschedule' | 'delete';

/** The rows of personal time's long-press menu. */
export function timeBlockMenuRows(t: (key: string) => string) {
  const row = (key: TimeBlockAction, icon: IconName, danger = false) => ({
    key,
    label: t(`personalTime.actions.${key}`),
    icon,
    danger,
  });
  return [
    row('rename', 'pencil'),
    row('reschedule', 'reschedule'),
    row('delete', 'trashBin', true),
  ];
}

export function useTimeBlockActions({ onDeleted }: { onDeleted?: () => void } = {}) {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const remove = useDeleteTimeBlockMutation(userId);

  const run = (block: TimeBlock, action: TimeBlockAction) => {
    switch (action) {
      case 'rename':
        return router.push({
          pathname: '/time-block/[blockId]/name',
          params: { blockId: block.id },
        });
      case 'reschedule':
        return router.push({
          pathname: '/time-block/[blockId]/move',
          params: { blockId: block.id },
        });
      case 'delete':
        onDeleted?.();
        return removeWithUndo({
          title: t('toasts.personalTimeDeleted'),
          summary: block.notes?.trim() || undefined,
          id: block.id,
          keys: [timeBlockKeys.all(userId)],
          commit: () => remove.mutateAsync(block.id),
        });
    }
  };

  return { run, isDeleting: remove.isPending };
}
