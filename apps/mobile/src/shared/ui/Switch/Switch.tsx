/**
 * Themed toggle. Thin wrapper over RN Switch so track/thumb colors come from tokens.
 * Used for instant-save settings (docs/design-system.md §4).
 */
import { Switch as RNSwitch, type SwitchProps as RNSwitchProps } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

export type SwitchProps = RNSwitchProps;

export function Switch({ value, ...rest }: SwitchProps) {
  const { theme } = useUnistyles();
  return (
    <RNSwitch
      value={value}
      trackColor={{ false: theme.colors.border.strong, true: theme.colors.accent.default }}
      thumbColor={theme.colors.bg.canvas}
      ios_backgroundColor={theme.colors.border.strong}
      accessibilityRole="switch"
      accessibilityState={{ checked: !!value }}
      {...rest}
    />
  );
}
