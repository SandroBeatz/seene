/**
 * Search field (design: time zone sheet): 48pt surface pill, 14pt radius, a
 * magnifier and the query. Clears with the OS clear button on iOS.
 */
import { TextInput, type TextInputProps, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { MAX_FONT_SCALE } from '@/shared/theme/tokens';
import { Icon } from '@/shared/ui/Icon';

export interface SearchFieldProps
  extends Pick<TextInputProps, 'value' | 'onChangeText' | 'placeholder' | 'autoFocus'> {
  accessibilityLabel: string;
}

export function SearchField({ accessibilityLabel, ...rest }: SearchFieldProps) {
  const { theme } = useUnistyles();
  return (
    <View style={styles.field}>
      <Icon name="search" size="base" color="content.tertiary" />
      <TextInput
        style={styles.input}
        accessibilityLabel={accessibilityLabel}
        placeholderTextColor={theme.colors.content.tertiary}
        selectionColor={theme.colors.accent.default}
        cursorColor={theme.colors.accent.default}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="while-editing"
        inputMode="search"
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  field: {
    height: theme.sizing.control.lg,
    borderRadius: theme.radius.field,
    backgroundColor: theme.colors.bg.surface,
    paddingHorizontal: theme.space[3.5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2.5],
  },
  input: {
    flex: 1,
    minWidth: 0,
    // Stretched by the row, not `height: '100%'`: a percentage height lets the
    // iOS text drift down on re-layout (a filter tap re-rendering the list).
    alignSelf: 'stretch',
    paddingVertical: 0,
    color: theme.colors.content.primary,
    fontFamily: theme.typography.callout.fontFamily,
    fontSize: theme.typography.callout.fontSize,
  },
}));
