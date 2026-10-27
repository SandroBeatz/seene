/**
 * Keyboard-aware form canvas: optional fixed header, scrollable body, and an action
 * footer that rides on top of the keyboard. Header, presentation, gestures and
 * navigation prevention remain explicit route responsibilities.
 *
 * Keyboard handling uses react-native-keyboard-controller so iOS and Android
 * (edge-to-edge) behave the same: the focused field scrolls above the keyboard and
 * the footer CTA sits right on top of it.
 *
 * Insets: include 'top' in `edges` for header-less screens (the content then starts
 * `layout.topGap` below the safe area); 'bottom' keeps the footer clear of the home
 * indicator / gesture bar.
 */
import { useState, type ReactNode } from 'react';
import { View, type ScrollViewProps } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export interface FormScreenProps extends Omit<
  ScrollViewProps,
  'children' | 'contentContainerStyle'
> {
  children: ReactNode;
  /** Fixed block above the scroll area (wizard step header). */
  header?: ReactNode;
  footer?: ReactNode;
  /** 1pt line above the footer — for screens whose body scrolls under it. */
  footerDivider?: boolean;
  padded?: boolean;
  edges?: readonly Edge[];
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

export function FormScreen({
  children,
  header,
  footer,
  footerDivider = false,
  padded = true,
  edges = ['right', 'bottom', 'left'],
  style,
  contentContainerStyle,
  contentInsetAdjustmentBehavior = 'automatic',
  keyboardShouldPersistTaps = 'handled',
  showsVerticalScrollIndicator = false,
  ...rest
}: FormScreenProps) {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const [footerHeight, setFooterHeight] = useState(0);

  const topPad = edges.includes('top') ? insets.top + theme.layout.topGap : 0;
  const bottomPad = edges.includes('bottom')
    ? Math.max(insets.bottom, theme.layout.minBottomGap)
    : theme.layout.minBottomGap;
  // While the keyboard is up the home-indicator gap is not needed under the CTA.
  const keyboardGap = theme.space[3];

  return (
    <View style={[styles.root, { paddingTop: topPad, backgroundColor: theme.colors.bg.canvas }]}>
      {header ? <View style={padded && styles.gutter}>{header}</View> : null}
      <KeyboardAwareScrollView
        style={[styles.scroll, style]}
        contentContainerStyle={[
          styles.content,
          padded && styles.gutter,
          { paddingBottom: footer ? theme.space[4] : bottomPad },
          contentContainerStyle,
        ]}
        bottomOffset={footerHeight + theme.space[4]}
        contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        {...rest}>
        {children}
      </KeyboardAwareScrollView>

      {footer ? (
        <KeyboardStickyView offset={{ closed: 0, opened: bottomPad - keyboardGap }}>
          <View
            onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
            style={[
              styles.footer,
              footerDivider && styles.footerDivider,
              { paddingBottom: bottomPad },
            ]}>
            {footer}
          </View>
        </KeyboardStickyView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1 },
  gutter: { paddingHorizontal: theme.layout.gutter },
  scroll: { flex: 1 },
  content: { flexGrow: 1 },
  footer: {
    gap: theme.space[2.5],
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.space[3],
    backgroundColor: theme.colors.bg.canvas,
  },
  footerDivider: { borderTopWidth: 1, borderTopColor: theme.colors.border.default },
}));
