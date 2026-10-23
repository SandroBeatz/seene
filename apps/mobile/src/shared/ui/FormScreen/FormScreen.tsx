/**
 * Keyboard-aware form canvas with a fixed action area. Header, presentation,
 * gestures and navigation prevention remain explicit route responsibilities.
 */
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ScrollViewProps,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export interface FormScreenProps extends Omit<
  ScrollViewProps,
  'children' | 'contentContainerStyle'
> {
  children: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
  edges?: readonly Edge[];
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

export function FormScreen({
  children,
  footer,
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bg.canvas }]} edges={edges}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <ScrollView
          style={[styles.scroll, style]}
          contentContainerStyle={[
            styles.content,
            padded && styles.padded,
            footer ? styles.withFooter : undefined,
            contentContainerStyle,
          ]}
          contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
          // KeyboardAvoidingView moves the fixed footer and scroll area together.
          // A second automatic keyboard inset would double the iOS adjustment.
          automaticallyAdjustKeyboardInsets={false}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          {...rest}>
          {children}
        </ScrollView>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: { flex: 1 },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  content: { flexGrow: 1 },
  padded: { paddingHorizontal: theme.space[4], paddingTop: theme.space[4] },
  withFooter: { paddingBottom: theme.space[6] },
  footer: {
    gap: theme.space[3],
    paddingHorizontal: theme.space[4],
    paddingTop: theme.space[3],
    paddingBottom: theme.space[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.bg.canvas,
  },
}));
