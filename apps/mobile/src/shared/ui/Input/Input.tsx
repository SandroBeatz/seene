/**
 * Labeled text field: label + field + help/error text (the Form pattern base).
 * docs/design-system.md §4.2. Wire to React Hook Form via `value`/`onChangeText`.
 *
 * The field owns its focus state: idle = 1pt default border, focused = 1.5pt ink
 * (plus an optional halo), error = 1.5pt rose. A `prefix`/`suffix` sits inside the
 * field (e.g. "getseene.app/" or a currency). Android's default vertical padding and
 * font padding are removed so the field is the same height on both platforms.
 */
import { forwardRef, useState, type ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { MAX_FONT_SCALE } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';

export type InputSize = 'md' | 'lg';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  /** Right-aligned note in the label row (e.g. "необязательно"). */
  labelHint?: string;
  error?: string;
  helpText?: string;
  /** md: 16pt text, 14pt inset. lg: 17pt text, 16pt inset (single-field screens). */
  size?: InputSize;
  prefix?: string;
  suffix?: string;
  /** Bold value text (username, price). */
  strong?: boolean;
  /** Soft halo around the focused field (price input). */
  focusRing?: boolean;
  /** Greyed, non-editable field (e.g. price when "free" is on). */
  inactive?: boolean;
  /** Custom content under the field instead of help/error text (status lines). */
  below?: ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    labelHint,
    error,
    helpText,
    size = 'md',
    prefix,
    suffix,
    strong = false,
    focusRing = false,
    inactive = false,
    below,
    multiline,
    editable,
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const { theme } = useUnistyles();
  const [focused, setFocused] = useState(false);
  const state = error ? 'error' : focused && !inactive ? 'focused' : 'idle';
  styles.useVariants({
    size,
    state,
    strong,
    multiline: !!multiline,
    inactive,
    halo: focusRing && state === 'focused',
  });

  const handleFocus: TextInputProps['onFocus'] = (e) => {
    setFocused(true);
    onFocus?.(e);
  };
  const handleBlur: TextInputProps['onBlur'] = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={styles.wrapper}>
      {label ? (
        <View style={styles.labelRow}>
          <Text variant="footnoteStrong" color="secondary">
            {label}
          </Text>
          {labelHint ? (
            <Text variant="footnote" color="secondary">
              {labelHint}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={styles.field}>
        {prefix ? (
          <Text variant={size === 'lg' ? 'bodyLarge' : 'callout'} color="secondary">
            {prefix}
          </Text>
        ) : null}
        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor={theme.colors.content.tertiary}
          selectionColor={theme.colors.accent.default}
          cursorColor={theme.colors.accent.default}
          accessibilityLabel={label}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          multiline={multiline}
          editable={inactive ? false : editable}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        {suffix ? (
          <Text variant="body" color="secondary">
            {suffix}
          </Text>
        ) : null}
      </View>
      {below ??
        (error ? (
          <Text variant="footnote" color="danger">
            {error}
          </Text>
        ) : helpText ? (
          <Text variant="footnote" color="secondary">
            {helpText}
          </Text>
        ) : null)}
    </View>
  );
});

const styles = StyleSheet.create((theme) => ({
  wrapper: { gap: theme.space[2], alignSelf: 'stretch' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg.canvas,
    variants: {
      size: {
        md: { paddingHorizontal: theme.space[3.5] },
        lg: { paddingHorizontal: theme.space[4] },
      },
      multiline: {
        true: { alignItems: 'flex-start', paddingVertical: theme.space[3.5] },
        false: { height: theme.sizing.control.xl },
      },
      state: {
        idle: { borderWidth: 1, borderColor: theme.colors.border.default },
        focused: { borderWidth: 1.5, borderColor: theme.colors.border.focus },
        error: { borderWidth: 1.5, borderColor: theme.colors.feedback.dangerBorder },
      },
      inactive: {
        true: { backgroundColor: theme.colors.bg.surface },
        false: {},
      },
      halo: {
        true: { boxShadow: `0px 0px 0px 4px ${theme.colors.control.focusRing}` },
        false: {},
      },
      strong: { true: {}, false: {} },
    },
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    includeFontPadding: false,
    color: theme.colors.content.primary,
    variants: {
      // Family + size only: a lineHeight on a single-line iOS TextInput shifts the text.
      size: {
        md: {
          fontFamily: theme.typography.callout.fontFamily,
          fontSize: theme.typography.callout.fontSize,
        },
        lg: {
          fontFamily: theme.typography.bodyLarge.fontFamily,
          fontSize: theme.typography.bodyLarge.fontSize,
        },
      },
      strong: {
        true: { fontFamily: theme.typography.calloutStrong.fontFamily },
        false: {},
      },
      multiline: {
        true: {
          fontFamily: theme.typography.body.fontFamily,
          fontSize: theme.typography.body.fontSize,
          lineHeight: theme.typography.body.lineHeight,
          minHeight: theme.typography.body.lineHeight * 2,
        },
        false: { height: '100%' },
      },
    },
  },
}));
