/**
 * A group of rows with 1pt separators between them.
 * filled: grey surface, 20pt radius (settings groups).
 * outlined: bordered, 16pt radius (form groups inside sheets).
 * Rows inside should be `ListItem inset={false}` — the card owns the side padding.
 */
import { Children, Fragment, type ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export type GroupedCardVariant = 'filled' | 'outlined';

export interface GroupedCardProps {
  children: ReactNode;
  variant?: GroupedCardVariant;
}

export function GroupedCard({ children, variant = 'filled' }: GroupedCardProps) {
  styles.useVariants({ variant });
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.card}>
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 ? <View style={styles.separator} /> : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    variants: {
      variant: {
        filled: {
          backgroundColor: theme.colors.bg.surface,
          borderRadius: theme.radius.xl,
          paddingHorizontal: theme.space[4],
          paddingVertical: theme.space[1],
        },
        outlined: {
          borderWidth: 1,
          borderColor: theme.colors.border.default,
          borderRadius: theme.radius.lg,
          paddingHorizontal: theme.space[3.5],
        },
      },
    },
  },
  separator: { height: 1, backgroundColor: theme.colors.border.default },
}));
