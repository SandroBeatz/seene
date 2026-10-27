export interface DurationPickerProps {
  visible: boolean;
  /** Current duration, minutes. */
  value: number;
  onCancel: () => void;
  onConfirm: (minutes: number) => void;
  title: string;
  cancelLabel: string;
  doneLabel: string;
  hoursUnit: string;
  minutesUnit: string;
  /** Default 24 h. */
  maxMinutes?: number;
  /** Minute wheel step. Default 5. */
  minuteStep?: number;
}
