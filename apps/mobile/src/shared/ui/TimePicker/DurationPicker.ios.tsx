/** iOS duration picker: "ч" / "мин" wheels in the system bottom panel. */
import { useState } from 'react';
import type { DurationPickerProps } from './types';
import { WheelPanel } from './WheelPanel';

export type { DurationPickerProps } from './types';

export function DurationPicker(props: DurationPickerProps) {
  // Mounted per opening, so the wheels start from the current value.
  return props.visible ? <DurationWheels {...props} /> : null;
}

function DurationWheels({
  value,
  onCancel,
  onConfirm,
  title,
  cancelLabel,
  doneLabel,
  hoursUnit,
  minutesUnit,
  maxMinutes = 24 * 60,
  minuteStep = 5,
}: DurationPickerProps) {
  const [hours, setHours] = useState(Math.floor(value / 60));
  const [minutes, setMinutes] = useState(value % 60 - ((value % 60) % minuteStep));
  const total = Math.min(maxMinutes, hours * 60 + minutes);
  return (
    <WheelPanel
      visible
      title={title}
      cancelLabel={cancelLabel}
      doneLabel={doneLabel}
      onCancel={onCancel}
      onDone={() => (total > 0 ? onConfirm(total) : onCancel())}
      left={{
        values: Array.from({ length: Math.floor(maxMinutes / 60) + 1 }, (_, i) => i),
        selection: hours,
        onChange: setHours,
      }}
      right={{
        values: Array.from({ length: 60 / minuteStep }, (_, i) => i * minuteStep),
        selection: minutes,
        onChange: setMinutes,
      }}
      leftUnit={hoursUnit}
      rightUnit={minutesUnit}
    />
  );
}
