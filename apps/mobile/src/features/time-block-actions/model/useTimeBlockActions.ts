/**
 * What the master can do with personal time, from its preview and the schedule's
 * long-press menu: another name, another time, or delete it (asks first).
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { useUserId } from '@/entities/session';
import { useDeleteTimeBlockMutation, type TimeBlock } from '@/entities/time-block';
import type { IconName } from '@/shared/ui';

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
        return Alert.alert(
          t('personalTime.deleteConfirm.title'),
          t('personalTime.deleteConfirm.message'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('personalTime.actions.delete'),
              style: 'destructive',
              onPress: () =>
                remove.mutate(block.id, {
                  onSuccess: onDeleted,
                  onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
                }),
            },
          ],
        );
    }
  };

  return { run, isDeleting: remove.isPending };
}
