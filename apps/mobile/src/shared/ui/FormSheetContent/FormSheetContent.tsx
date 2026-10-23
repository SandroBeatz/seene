/**
 * Cross-platform body chrome for a native form sheet. Android form sheets do not
 * render a Stack header, so the title and actions intentionally live in content.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { FormScreen } from '@/shared/ui/FormScreen';
import { Text } from '@/shared/ui/Text';

export interface FormSheetContentProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
}

export function FormSheetContent({
  title,
  description,
  children,
  footer,
  headerLeft,
  headerRight,
}: FormSheetContentProps) {
  return (
    <FormScreen footer={footer} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerSide}>{headerLeft}</View>
        <View style={styles.heading}>
          <Text variant="title2" style={styles.centered}>
            {title}
          </Text>
          {description ? (
            <Text variant="subhead" color="secondary" style={styles.centered}>
              {description}
            </Text>
          ) : null}
        </View>
        <View style={styles.headerSide}>{headerRight}</View>
      </View>
      {children}
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { gap: theme.space[4] },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.space[2] },
  headerSide: { width: theme.sizing.minTouch, minHeight: theme.sizing.minTouch },
  heading: { flex: 1, gap: theme.space[1], paddingTop: theme.space[2] },
  centered: { textAlign: 'center' },
}));
