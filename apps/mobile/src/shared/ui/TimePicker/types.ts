interface PickerChrome {
  visible: boolean;
  onCancel: () => void;
  title: string;
  cancelLabel: string;
  doneLabel: string;
}

export interface DurationPickerProps extends PickerChrome {
  /** Current duration, minutes. */
  value: number;
  onConfirm: (minutes: number) => void;
  hoursUnit: string;
  minutesUnit: string;
  /** Default 24 h. */
  maxMinutes?: number;
  /** Minute wheel step. Default 5. */
  minuteStep?: number;
}

export interface TimePickerProps extends PickerChrome {
  /** Wall-clock "HH:mm". */
  value: string;
  onConfirm: (time: string) => void;
  /** Minute wheel step. Default 5. */
  minuteStep?: number;
}

/** "9:5" → "09:05". */
export const toClock = (hours: number, minutes: number) =>
  `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

/** "09:30" → [9, 30]. */
export const fromClock = (time: string): [number, number] => {
  const [h = '0', m = '0'] = time.split(':');
  return [Number(h) || 0, Number(m) || 0];
};

export interface BirthdayPickerProps extends PickerChrome {
  /** Current day and month (1-based), or null to start from today. */
  value: { day: number; month: number } | null;
  onConfirm: (value: { day: number; month: number }) => void;
  /** Month names as they read after a day number ("мая"), January first. */
  monthNames: readonly string[];
}

const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Days a birthday can fall on in a month, any year (29 February allowed). */
export const daysInMonth = (month: number) => MONTH_DAYS[month - 1] ?? 31;
