/**
 * Scrollable screen content. Navigator chrome stays in `_layout.tsx`/`Stack.Screen`;
 * this component only owns the canvas, content padding and native scroll insets.
 */
import type { ReactNode } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export interface ScreenScrollViewProps extends Omit<
  ScrollViewProps,
  'children' | 'contentContainerStyle'
> {
  children: ReactNode;
  padded?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

export function ScreenScrollView({
  children,
  padded = true,
  style,
  contentContainerStyle,
  contentInsetAdjustmentBehavior = 'automatic',
  keyboardShouldPersistTaps = 'handled',
  showsVerticalScrollIndicator = false,
  ...rest
}: ScreenScrollViewProps) {
  const { theme } = useUnistyles();

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.colors.bg.canvas }, style]}
      contentContainerStyle={[styles.content, padded && styles.padded, contentContainerStyle]}
      contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      {...rest}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1 },
  content: { flexGrow: 1 },
  padded: {
    paddingHorizontal: theme.space[4],
    paddingTop: theme.space[4],
    paddingBottom: theme.space[8],
  },
}));
