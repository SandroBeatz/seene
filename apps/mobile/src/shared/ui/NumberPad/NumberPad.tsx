/** Digits for typing a sum on the screen (design "Новый расход"): 1–9, "000", 0 and erase. */
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon } from '@/shared/ui/Icon';
import { Text } from '@/shared/ui/Text';

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['000', '0', 'erase'],
] as const;

export interface NumberPadProps {
  /** One or more digits to add. */
  onDigits: (digits: string) => void;
  onErase: () => void;
  eraseLabel: string;
}

export function NumberPad({ onDigits, onErase, eraseLabel }: NumberPadProps) {
  return (
    <View style={styles.pad}>
      {ROWS.map((row) => (
        <View key={row.join()} style={styles.row}>
          {row.map((key) => {
            const plain = key === '000' || key === 'erase';
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={key === 'erase' ? eraseLabel : key}
                onPress={() => (key === 'erase' ? onErase() : onDigits(key))}
                style={({ pressed }) => [
                  styles.key,
                  !plain && styles.filled,
                  pressed && styles.pressed,
                ]}>
                {key === 'erase' ? (
                  <Icon name="backspace" size={24} color="content.primary" />
                ) : (
                  <Text variant={key === '000' ? 'keyCompact' : 'key'}>{key}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  pad: { gap: theme.space[1.5] },
  row: { flexDirection: 'row', gap: theme.space[1.5] },
  key: {
    flex: 1,
    height: 50,
    borderRadius: theme.radius.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: { backgroundColor: theme.colors.bg.surface },
  pressed: { opacity: 0.6 },
}));
