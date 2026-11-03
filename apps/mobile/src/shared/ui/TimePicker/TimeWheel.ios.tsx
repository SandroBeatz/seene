/** iOS: one wheel of times, inline in the sheet (design "Рабочие часы, день"). */
import { Host, Picker, Text as SwiftText } from '@expo/ui/swift-ui';
import { clipped, labelsHidden, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet } from 'react-native-unistyles';
import { useThemeStore } from '@/shared/theme/theme.store';
import { type TimeWheelProps, wheelTimes } from './types';

export type { TimeWheelProps } from './types';

export function TimeWheel({ value, onChange, minuteStep }: TimeWheelProps) {
  // The wheel follows the system unless told otherwise; the app's theme can differ from it.
  const mode = useThemeStore((state) => state.mode);
  return (
    <Host style={styles.host} colorScheme={mode === 'auto' ? undefined : mode}>
      <Picker
        selection={value}
        onSelectionChange={(time: string) => onChange(time)}
        modifiers={[pickerStyle('wheel'), labelsHidden(), clipped()]}>
        {wheelTimes(value, minuteStep).map((time) => (
          <SwiftText key={time} modifiers={[tag(time)]}>
            {time}
          </SwiftText>
        ))}
      </Picker>
    </Host>
  );
}

const styles = StyleSheet.create((theme) => ({
  host: {
    flex: 1,
    height: 150,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg.surface,
  },
}));
