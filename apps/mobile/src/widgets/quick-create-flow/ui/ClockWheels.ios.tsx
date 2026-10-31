/** iOS: the system hour and minute wheels (SwiftUI wheel pickers) inline in the sheet. */
import { Host, HStack, Picker, Text as SwiftText } from '@expo/ui/swift-ui';
import { clipped, frame, labelsHidden, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet } from 'react-native';
import type { ClockWheelsProps } from './ClockWheels.types';

export type { ClockWheelsProps } from './ClockWheels.types';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const pad = (n: number) => String(n).padStart(2, '0');

export function ClockWheels({ hour, minute, minuteStep, onChange }: ClockWheelsProps) {
  const minutes = Array.from({ length: 60 / minuteStep }, (_, i) => i * minuteStep);
  return (
    <Host style={styles.host}>
      <HStack spacing={0}>
        <Picker
          selection={hour}
          onSelectionChange={(h: number) => onChange(h, minute)}
          modifiers={[pickerStyle('wheel'), labelsHidden(), frame({ width: 96 }), clipped()]}>
          {HOURS.map((h) => (
            <SwiftText key={h} modifiers={[tag(h)]}>
              {pad(h)}
            </SwiftText>
          ))}
        </Picker>
        <SwiftText>:</SwiftText>
        <Picker
          selection={minute}
          onSelectionChange={(m: number) => onChange(hour, m)}
          modifiers={[pickerStyle('wheel'), labelsHidden(), frame({ width: 96 }), clipped()]}>
          {minutes.map((m) => (
            <SwiftText key={m} modifiers={[tag(m)]}>
              {pad(m)}
            </SwiftText>
          ))}
        </Picker>
      </HStack>
    </Host>
  );
}

const styles = StyleSheet.create({ host: { height: 216 } });
