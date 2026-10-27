/**
 * One-time code field: N equal cells over a single invisible TextInput, so paste,
 * OS autofill (iOS "From Mail"/SMS, Android autofill) and the number pad all work
 * natively. Cells: filled = surface, active = ink outline, error = rose.
 */
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/ui/Text';

export interface CodeInputProps {
  value: string;
  onChangeText: (code: string) => void;
  /** Fires once when the last digit is entered. */
  onComplete?: (code: string) => void;
  length?: number;
  error?: boolean;
  autoFocus?: boolean;
  accessibilityLabel: string;
}

export const CodeInput = forwardRef<TextInput, CodeInputProps>(function CodeInput(
  {
    value,
    onChangeText,
    onComplete,
    length = 6,
    error = false,
    autoFocus = true,
    accessibilityLabel,
  },
  ref,
) {
  const inputRef = useRef<TextInput>(null);
  useImperativeHandle(ref, () => inputRef.current as TextInput);
  const [focused, setFocused] = useState(autoFocus);
  const digits = value.split('');

  const handleChange = (text: string) => {
    const next = text.replace(/\D/g, '').slice(0, length);
    onChangeText(next);
    if (next.length === length && value.length !== length) onComplete?.(next);
  };

  return (
    <Pressable style={styles.row} accessible={false} onPress={() => inputRef.current?.focus()}>
      {Array.from({ length }, (_, index) => {
        const digit = digits[index] ?? '';
        const active = focused && !error && index === value.length;
        const state = error ? 'error' : active ? 'active' : digit ? 'filled' : 'empty';
        return <CodeCell key={index} digit={digit} state={state} />;
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        caretHidden
        accessibilityLabel={accessibilityLabel}
        style={styles.hiddenInput}
      />
    </Pressable>
  );
});

type CellState = 'empty' | 'filled' | 'active' | 'error';

function CodeCell({ digit, state }: { digit: string; state: CellState }) {
  cellStyles.useVariants({ state });
  return (
    <View style={cellStyles.cell}>
      <Text variant="figure" tabularNums>
        {digit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', gap: theme.space[2] },
  // Covers the cells so a tap anywhere focuses it; transparent text keeps it invisible.
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: 'transparent',
    opacity: 0.011,
  },
}));

const cellStyles = StyleSheet.create((theme) => ({
  cell: {
    flex: 1,
    height: theme.sizing.codeCell,
    borderRadius: theme.radius.field,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      state: {
        empty: {
          backgroundColor: theme.colors.bg.canvas,
          borderColor: theme.colors.border.default,
        },
        filled: {
          backgroundColor: theme.colors.bg.surface,
          borderColor: theme.colors.border.default,
        },
        active: { backgroundColor: theme.colors.bg.canvas, borderColor: theme.colors.border.focus },
        error: {
          backgroundColor: theme.colors.feedback.dangerSubtle,
          borderColor: theme.colors.feedback.dangerBorder,
        },
      },
    },
  },
}));
