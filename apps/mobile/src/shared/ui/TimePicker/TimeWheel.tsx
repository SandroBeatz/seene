/** Android (and web): the time in large type; a tap opens the system time dialog. */
import { useState } from 'react';
import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/ui/Text';
import { TimePicker } from './TimePicker';
import type { TimeWheelProps } from './types';

export type { TimeWheelProps } from './types';

export function TimeWheel({
  value,
  onChange,
  minuteStep,
  title,
  cancelLabel,
  doneLabel,
}: TimeWheelProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${value}`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
        <Text variant="figure" tabularNums>
          {value}
        </Text>
      </Pressable>
      <TimePicker
        visible={open}
        value={value}
        minuteStep={minuteStep}
        title={title}
        cancelLabel={cancelLabel}
        doneLabel={doneLabel}
        onCancel={() => setOpen(false)}
        onConfirm={(time) => {
          setOpen(false);
          onChange(time);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  field: {
    flex: 1,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg.surface,
  },
  pressed: { opacity: 0.7 },
}));
