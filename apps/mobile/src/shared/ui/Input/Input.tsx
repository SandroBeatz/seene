/**
 * Labeled text field: label + input + error/help text (the Form pattern base).
 * docs/design-system.md §4.2. Wire to React Hook Form via `value`/`onChangeText`.
 */
import { forwardRef } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/ui/Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, helpText, style, ...rest },
  ref,
) {
  const { theme } = useUnistyles();
  const hasError = !!error;
  styles.useVariants({ error: hasError });

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text variant="subhead" color="secondary">
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        style={[styles.input, style]}
        placeholderTextColor={theme.colors.content.tertiary}
        accessibilityLabel={label}
        {...rest}
      />
      {error ? (
        <Text variant="footnote" color="danger">
          {error}
        </Text>
      ) : helpText ? (
        <Text variant="footnote" color="tertiary">
          {helpText}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create((theme) => ({
  wrapper: { gap: theme.space[1], alignSelf: 'stretch' },
  input: {
    minHeight: theme.sizing.control.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.space[3],
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.content.primary,
    backgroundColor: theme.colors.bg.surface,
    variants: {
      error: {
        true: { borderColor: theme.colors.feedback.danger },
        false: { borderColor: theme.colors.border.default },
      },
    },
  },
}));
