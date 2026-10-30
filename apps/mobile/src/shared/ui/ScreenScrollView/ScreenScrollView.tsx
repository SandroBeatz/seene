/**
 * Scrollable screen content. Navigator chrome stays in `_layout.tsx`/`Stack.Screen`;
 * this component only owns the canvas, content padding and native scroll insets.
 */
import type { ReactNode } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  // iOS insets the content under the native header and tab bar itself; a screen that
  // opts out (it draws its own header) still keeps the last row clear of the tab bar.
  // Inside a native tab the safe area's bottom includes the bar.
  const bottomInset =
    process.env.EXPO_OS === 'ios' && contentInsetAdjustmentBehavior === 'never'
      ? { paddingBottom: insets.bottom + (padded ? theme.space[8] : 0) }
      : null;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.colors.bg.canvas }, style]}
      contentContainerStyle={[
        styles.content,
        padded && styles.padded,
        bottomInset,
        contentContainerStyle,
      ]}
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
