/**
 * iOS back button for the floating wizard header: a native SwiftUI button in the
 * system glass style (Liquid Glass on iOS 26) with the `chevron.backward` symbol,
 * so it matches the navigation bar's buttons. The header floats over the stack,
 * outside any native bar, which is why it can't be a `Stack.Toolbar` item.
 * Without the glass API (iOS < 26, Reduce Transparency) it falls back to the kit's
 * round button.
 */
import { Button, Host } from '@expo/ui/swift-ui';
import {
  buttonBorderShape,
  buttonStyle,
  controlSize,
  labelStyle,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useReduceTransparency } from '../hooks/useReduceTransparency';
import { IconButton } from '../IconButton';
import type { StepBackButtonProps } from './StepBackButton.types';

export function StepBackButton({ label, onPress }: StepBackButtonProps) {
  const { theme } = useUnistyles();
  const reduceTransparency = useReduceTransparency();

  if (!isGlassEffectAPIAvailable() || reduceTransparency) {
    return (
      <IconButton icon="chevronLeft" variant="neutral" accessibilityLabel={label} onPress={onPress} />
    );
  }

  return (
    // The app's theme, not only the OS appearance, picks the glass's light/dark look.
    <Host matchContents colorScheme={theme.name === 'dark' ? 'dark' : 'light'} style={styles.host}>
      <Button
        label={label}
        systemImage="chevron.backward"
        onPress={onPress}
        modifiers={[
          labelStyle('iconOnly'),
          buttonStyle('glass'),
          buttonBorderShape('circle'),
          controlSize('large'),
          tint(theme.colors.content.primary),
        ]}
      />
    </Host>
  );
}

const styles = StyleSheet.create((theme) => ({
  host: { minWidth: theme.sizing.iconButton, minHeight: theme.sizing.iconButton },
}));
