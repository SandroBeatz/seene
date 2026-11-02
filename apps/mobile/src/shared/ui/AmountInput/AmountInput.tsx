/**
 * A number field as wide as its text, for a sum that sits beside its currency. iOS does
 * not re-measure a single-line TextInput reliably while it is being typed in, which cuts
 * off the first digit, so a hidden copy of the text sets the width.
 */
import { useState } from 'react';
import {
  Text as RNText,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

/** Room for the caret after the last digit. */
const CARET_WIDTH = 4;

export interface AmountInputProps extends Omit<TextInputProps, 'style' | 'value'> {
  value: string;
  style: StyleProp<TextStyle>;
}

export function AmountInput({ value, placeholder, style, ...props }: AmountInputProps) {
  const [width, setWidth] = useState<number>();

  return (
    <>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.measure}>
        <RNText
          style={style}
          onLayout={(event) => setWidth(Math.ceil(event.nativeEvent.layout.width) + CARET_WIDTH)}>
          {value || placeholder}
        </RNText>
      </View>
      <TextInput
        {...props}
        value={value}
        placeholder={placeholder}
        keyboardType="number-pad"
        style={[style, styles.input, width !== undefined && { width }]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // Wider than any sum so the copy is never wrapped; a sum wider than the row scrolls.
  measure: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 2000,
    height: 0,
    overflow: 'hidden',
    alignItems: 'flex-start',
    opacity: 0,
  },
  input: { flexShrink: 1, padding: 0 },
});
