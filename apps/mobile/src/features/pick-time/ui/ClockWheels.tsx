/** Android (and web): the time in large type; a tap opens the system time dialog. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, TimePicker } from '@/shared/ui';
import type { ClockWheelsProps } from './ClockWheels.types';

export type { ClockWheelsProps } from './ClockWheels.types';

const pad = (n: number) => String(n).padStart(2, '0');

export function ClockWheels({ hour, minute, minuteStep, onChange }: ClockWheelsProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const clock = `${pad(hour)}:${pad(minute)}`;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('quickCreate.time.ownA11y', { time: clock })}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.clock, pressed && styles.pressed]}>
        <Text variant="display" tabularNums>
          {clock}
        </Text>
      </Pressable>
      <TimePicker
        visible={open}
        value={clock}
        minuteStep={minuteStep}
        title={t('quickCreate.time.own')}
        cancelLabel={t('common.cancel')}
        doneLabel={t('common.confirm')}
        onCancel={() => setOpen(false)}
        onConfirm={(value) => {
          setOpen(false);
          const [h, m] = value.split(':').map(Number);
          onChange(h, m - (m % minuteStep));
        }}
      />
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  clock: {
    alignSelf: 'stretch',
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg.surface,
  },
  pressed: { opacity: 0.7 },
}));
