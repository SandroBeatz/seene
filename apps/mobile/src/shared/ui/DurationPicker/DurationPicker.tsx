/**
 * Android (and web) duration picker: the system time dialog in 24-hour mode, read
 * as hours + minutes — "На Android откроется свой, в стиле Android".
 */
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import type { DurationPickerProps } from './types';

export type { DurationPickerProps } from './types';

export function DurationPicker({
  visible,
  value,
  onCancel,
  onConfirm,
  doneLabel,
  cancelLabel,
  maxMinutes = 24 * 60,
}: DurationPickerProps) {
  if (!visible) return null;
  const initial = new Date(2000, 0, 1, Math.floor(value / 60), value % 60);
  return (
    <DateTimePicker
      value={initial}
      mode="time"
      is24Hour
      presentation="dialog"
      positiveButton={{ label: doneLabel }}
      negativeButton={{ label: cancelLabel }}
      onDismiss={onCancel}
      onValueChange={(_, date) => {
        const minutes = Math.min(maxMinutes, date.getHours() * 60 + date.getMinutes());
        if (minutes > 0) onConfirm(minutes);
        else onCancel();
      }}
    />
  );
}
