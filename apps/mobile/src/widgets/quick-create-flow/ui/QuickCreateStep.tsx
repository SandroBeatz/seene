import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Card, FormScreen, Text } from '@/shared/ui';

export interface QuickCreateStepProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  children?: ReactNode;
}

export function QuickCreateStep({
  title,
  description,
  actionLabel,
  onAction,
  children,
}: QuickCreateStepProps) {
  return (
    <FormScreen
      contentContainerStyle={styles.content}
      footer={<Button label={actionLabel} onPress={onAction} fullWidth />}>
      <Card>
        <Text variant="title2">{title}</Text>
        <Text variant="body" color="secondary">
          {description}
        </Text>
      </Card>
      {children}
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { gap: theme.space[4] },
}));
