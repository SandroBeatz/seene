/** Android (and web) time-of-day picker: the system time dialog, 24-hour. */
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { fromClock, type TimePickerProps, toClock } from './types';

export type { TimePickerProps } from './types';

export function TimePicker({ visible, value, onCancel, onConfirm, doneLabel, cancelLabel }: TimePickerProps) {
  if (!visible) return null;
  const [h, m] = fromClock(value);
  return (
    <DateTimePicker
      value={new Date(2000, 0, 1, h, m)}
      mode="time"
      is24Hour
      presentation="dialog"
      positiveButton={{ label: doneLabel }}
      negativeButton={{ label: cancelLabel }}
      onDismiss={onCancel}
      onValueChange={(_, date) => onConfirm(toClock(date.getHours(), date.getMinutes()))}
    />
  );
}
