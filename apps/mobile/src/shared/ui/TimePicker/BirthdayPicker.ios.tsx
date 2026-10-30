/** iOS birthday picker: day and month wheels ("14 · мая"), no year. */
import { useState } from 'react';
import { daysInMonth, type BirthdayPickerProps } from './types';
import { WheelPanel } from './WheelPanel';

export type { BirthdayPickerProps } from './types';

export function BirthdayPicker(props: BirthdayPickerProps) {
  // Mounted per opening, so the wheels start from the current value.
  return props.visible ? <BirthdayWheels {...props} /> : null;
}

function BirthdayWheels({
  value,
  onCancel,
  onConfirm,
  title,
  cancelLabel,
  doneLabel,
  monthNames,
}: BirthdayPickerProps) {
  const today = new Date();
  const [month, setMonth] = useState(value?.month ?? today.getMonth() + 1);
  const [day, setDay] = useState(value?.day ?? today.getDate());
  const maxDay = daysInMonth(month);
  return (
    <WheelPanel
      visible
      title={title}
      cancelLabel={cancelLabel}
      doneLabel={doneLabel}
      onCancel={onCancel}
      onDone={() => onConfirm({ day: Math.min(day, maxDay), month })}
      left={{
        values: Array.from({ length: maxDay }, (_, i) => i + 1),
        selection: Math.min(day, maxDay),
        onChange: setDay,
        width: 70,
      }}
      right={{
        values: Array.from({ length: 12 }, (_, i) => i + 1),
        selection: month,
        onChange: setMonth,
        label: (m) => monthNames[m - 1] ?? String(m),
        width: 150,
      }}
    />
  );
}
