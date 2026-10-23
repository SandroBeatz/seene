import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export interface DividerProps {
  inset?: boolean;
}

export function Divider({ inset = false }: DividerProps) {
  styles.useVariants({ inset });
  return <View style={styles.line} accessibilityRole="none" />;
}

const styles = StyleSheet.create((theme) => ({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border.default,
    variants: {
      inset: {
        true: { marginLeft: theme.space[4] },
        false: {},
      },
    },
  },
}));
