/**
 * Deleting with "Отменить" (design "Тосты"): the row leaves the lists at once, and the delete
 * itself runs when the toast goes. If it fails, the row comes back.
 */
import type { QueryKey } from '@tanstack/react-query';
import { queryClient } from '@/shared/api/query-client';
import { i18n } from '@/shared/lib/i18n';
import type { IconName } from '../Icon';
import { showFailedToast } from './feedback';
import { hideFromLists } from './hide-from-lists';
import { showToast } from './toast.store';

export interface RemoveWithUndo {
  title: string;
  summary?: string;
  id: string;
  /** The cached lists the row is in. */
  keys: readonly QueryKey[];
  commit: () => Promise<unknown>;
  /** True if it told the master itself. Otherwise the usual failed toast, with "Повторить". */
  onFailed?: (error: unknown) => boolean;
  icon?: IconName;
}

export function removeWithUndo(input: RemoveWithUndo) {
  const { title, summary, id, keys, commit, onFailed, icon = 'trash' } = input;
  const restore = hideFromLists(queryClient, keys, id);
  showToast({
    title,
    summary,
    tone: 'neutral',
    icon,
    action: { label: i18n.t('toasts.undo'), onPress: restore },
    onLeave: () => {
      commit().catch((error: unknown) => {
        restore();
        if (!onFailed?.(error)) showFailedToast(() => removeWithUndo(input));
      });
    },
  });
}
