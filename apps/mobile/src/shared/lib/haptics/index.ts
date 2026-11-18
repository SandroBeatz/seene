/**
 * Haptic feedback, one vocabulary for the whole app. Fire-and-forget: a device
 * without a Taptic Engine (or with system haptics off) just stays silent, and web
 * has none. The OS already ticks for native menus and pickers; these cover what we
 * draw ourselves.
 */
import * as Haptics from 'expo-haptics';
import { Alert, type AlertButton, type AlertOptions } from 'react-native';

const enabled = process.env.EXPO_OS === 'ios' || process.env.EXPO_OS === 'android';

function run(feedback: () => Promise<void>) {
  if (!enabled) return;
  feedback().catch(() => {});
}

export const haptics = {
  /** Switching tabs, segments, picks in a list. */
  selection: () => run(() => Haptics.selectionAsync()),
  /** A tap on a primary control: the "+", a tab switch. */
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** A long press took effect: a menu or a hint opens. */
  longPress: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Something to confirm or take note of: an alert, a confirmation. */
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};

/** `Alert.alert` with a warning tap, so every confirmation and alert is felt. */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions,
) {
  haptics.warning();
  Alert.alert(title, message, buttons, options);
}
