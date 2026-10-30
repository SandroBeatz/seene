/**
 * Scrollable screen content. Navigator chrome stays in `_layout.tsx`/`Stack.Screen`;
 * this component only owns the canvas, content padding and native scroll insets.
 */
import type { ReactNode } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useFloatingTabBarInset } from '../FloatingTabBar';

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
  // On tab roots the floating tab bar covers the bottom; keep the last row clear of it.
  const tabBarInset = useFloatingTabBarInset();
  const bottomInset =
    tabBarInset > 0 ? { paddingBottom: tabBarInset + (padded ? theme.space[8] : 0) } : null;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.colors.bg.canvas }, style]}
      contentContainerStyle={[
        styles.content,
        padded && styles.padded,
        bottomInset,
        contentContainerStyle,
      ]}
      scrollIndicatorInsets={tabBarInset > 0 ? { bottom: tabBarInset } : undefined}
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
