/** The toasts for what went wrong: the same words on every screen. */
import { onlineManager } from '@tanstack/react-query';
import { i18n } from '@/shared/lib/i18n';
import { showToast } from './toast.store';

/** A save that didn't go through. With `retry` the toast offers "Повторить". */
export function showFailedToast(retry?: () => void) {
  const key = onlineManager.isOnline() ? 'failed' : 'offline';
  showToast({
    title: i18n.t(`toasts.${key}.title`),
    summary: i18n.t(`toasts.${key}.summary`),
    tone: 'danger',
    action: retry ? { label: i18n.t('toasts.retry'), onPress: retry } : undefined,
  });
}

/** One short line about what can't be done. Longer explanations stay in a dialog. */
export function showErrorToast(title: string) {
  showToast({ title, tone: 'danger' });
}
