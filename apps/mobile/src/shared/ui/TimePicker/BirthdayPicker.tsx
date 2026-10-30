/** Android (and web) birthday picker: the system date dialog; the year is ignored. */
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import type { BirthdayPickerProps } from './types';

export type { BirthdayPickerProps } from './types';

export function BirthdayPicker({ visible, value, onCancel, onConfirm, doneLabel, cancelLabel }: BirthdayPickerProps) {
  if (!visible) return null;
  // A leap year, so 29 February can be picked.
  const start = value ? new Date(2000, value.month - 1, value.day) : new Date();
  return (
    <DateTimePicker
      value={start}
      mode="date"
      presentation="dialog"
      positiveButton={{ label: doneLabel }}
      negativeButton={{ label: cancelLabel }}
      onDismiss={onCancel}
      onValueChange={(_, date) => onConfirm({ day: date.getDate(), month: date.getMonth() + 1 })}
    />
  );
}
