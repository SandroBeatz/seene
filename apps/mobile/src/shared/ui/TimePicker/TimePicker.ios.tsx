/** iOS time-of-day picker: "HH : MM" wheels in the system bottom panel. */
import { useState } from 'react';
import { fromClock, type TimePickerProps, toClock } from './types';
import { WheelPanel } from './WheelPanel';

export type { TimePickerProps } from './types';

export function TimePicker(props: TimePickerProps) {
  // Mounted per opening, so the wheels start from the current value.
  return props.visible ? <TimeWheels {...props} /> : null;
}

function TimeWheels({
  value,
  onCancel,
  onConfirm,
  title,
  cancelLabel,
  doneLabel,
  minuteStep = 5,
}: TimePickerProps) {
  const [h0, m0] = fromClock(value);
  const [hours, setHours] = useState(h0);
  const [minutes, setMinutes] = useState(m0 - (m0 % minuteStep));
  return (
    <WheelPanel
      visible
      title={title}
      cancelLabel={cancelLabel}
      doneLabel={doneLabel}
      onCancel={onCancel}
      onDone={() => onConfirm(toClock(hours, minutes))}
      left={{ values: Array.from({ length: 24 }, (_, i) => i), selection: hours, onChange: setHours, pad: true }}
      right={{
        values: Array.from({ length: 60 / minuteStep }, (_, i) => i * minuteStep),
        selection: minutes,
        onChange: setMinutes,
        pad: true,
      }}
      separator=":"
    />
  );
}
