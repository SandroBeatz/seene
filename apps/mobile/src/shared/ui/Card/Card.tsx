/**
 * Surface container. Radius `lg`, token padding, optional elevation. The neutral
 * aesthetic prefers borders over heavy shadows (docs/design-system.md §3.5).
 */
import { View, type ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export interface CardProps extends ViewProps {
  elevated?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ elevated = false, padding = 'md', style, ...rest }: CardProps) {
  styles.useVariants({ elevated, padding });
  return <View style={[styles.card, style]} {...rest} />;
}

const styles = StyleSheet.create((theme) => ({
  card: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    variants: {
      elevated: {
        true: theme.elevation[2],
        false: {},
      },
      padding: {
        none: { padding: 0 },
        sm: { padding: theme.space[3] },
        md: { padding: theme.space[4] },
        lg: { padding: theme.space[5] },
      },
    },
  },
}));
