/**
 * What the toast on top of the app shows (design "Тосты"). One at a time: a new one takes
 * the place of the last. Lives in memory: it is about what was just done.
 */
import { create } from 'zustand';
import { haptics } from '@/shared/lib/haptics';
import type { IconName } from '../Icon';

export type ToastTone = 'success' | 'neutral' | 'danger';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface ToastData {
  title: string;
  summary?: string;
  /** The round mark's colour. Default `success`. */
  tone?: ToastTone;
  /** The round mark's glyph, when the tone's own doesn't fit. */
  icon?: IconName;
  /** A word in the title row: "Отменить", "Повторить". */
  action?: ToastAction;
  /** A wide button under the title row: "Отправить клиенту". */
  cta?: ToastAction & { icon?: IconName };
  /** When it goes any way but by its own button: the delayed half of an undoable action. */
  onLeave?: () => void;
}

export type ShownToast = ToastData & { id: number };

/** How long it stays: as long as it takes to reach for what it offers. */
export function toastDuration(toast: Pick<ToastData, 'action' | 'cta'>): number {
  if (toast.cta) return 6_000;
  if (toast.action) return 5_000;
  return 3_000;
}

let lastId = 0;

export const useToastStore = create<{ toast: ShownToast | null }>()(() => ({ toast: null }));

function replace(next: ShownToast | null) {
  const left = useToastStore.getState().toast;
  useToastStore.setState({ toast: next });
  left?.onLeave?.();
}

/** Safe anywhere, mutation callbacks included. Felt as well as seen: a haptic by tone. */
export function showToast(toast: ToastData) {
  const tone = toast.tone ?? 'success';
  if (tone === 'success') haptics.success();
  else if (tone === 'danger') haptics.error();
  else haptics.tap();
  replace({ ...toast, id: ++lastId });
}

export function dismissToast() {
  replace(null);
}

/** Its own button was pressed: `onLeave` doesn't run. */
export function pressToastAction(action: ToastAction) {
  useToastStore.setState({ toast: null });
  action.onPress();
}
