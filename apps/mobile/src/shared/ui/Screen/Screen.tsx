/**
 * Screen scaffold: safe-area padded canvas. Every route renders inside one so
 * background + safe areas are consistent.
 */
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export interface ScreenProps {
  children: ReactNode;
  padded?: boolean;
  center?: boolean;
  edges?: readonly Edge[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({
  children,
  padded = true,
  center = false,
  edges = ['top', 'right', 'bottom', 'left'],
  style,
  contentStyle,
}: ScreenProps) {
  // Subscribing to the theme here forces the screen to re-render on a theme
  // change and paint an inline canvas color. Native tab screens are detached /
  // frozen while inactive, so Unistyles' render-free native update can't reach
  // them; without this they keep the old theme's background until remounted.
  const { theme } = useUnistyles();
  styles.useVariants({ padded, center });
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bg.canvas }, style]}
      edges={edges}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: { flex: 1 },
  content: {
    flex: 1,
    variants: {
      padded: {
        true: { padding: theme.space[4] },
        false: {},
      },
      center: {
        true: { alignItems: 'center', justifyContent: 'center' },
        false: {},
      },
    },
  },
}));
