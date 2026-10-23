/**
 * Blocking confirmation modal (delete, sign out). For non-blocking previews/pickers
 * prefer Sheet. docs/design-system.md §4.2.
 */
import type { ReactNode } from 'react';
import { Modal as RNModal, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/ui/Text';

export interface ModalProps {
  visible: boolean;
  onRequestClose: () => void;
  title?: string;
  children?: ReactNode;
  /** Footer actions (usually Buttons). */
  footer?: ReactNode;
}

export function Modal({ visible, onRequestClose, title, children, footer }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
      statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onRequestClose} accessibilityRole="none">
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {title ? (
            <Text variant="title3" style={styles.title}>
              {title}
            </Text>
          ) : null}
          {children}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.space[6],
  },
  card: {
    alignSelf: 'stretch',
    backgroundColor: theme.colors.bg.elevated,
    borderRadius: theme.radius.xl,
    padding: theme.space[5],
    gap: theme.space[3],
    ...theme.elevation[3],
  },
  title: {},
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: theme.space[2] },
}));
