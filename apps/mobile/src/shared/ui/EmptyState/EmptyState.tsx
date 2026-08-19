/**
 * Empty-state surface: icon + message + optional primary action.
 * Every list/section renders this when it has no data (docs/design-system.md §6).
 */
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '@/shared/ui/Button';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Text } from '@/shared/ui/Text';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'empty',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Icon name={icon} size={32} color="content.tertiary" />
      <Text variant="headline" style={styles.centered}>
        {title}
      </Text>
      {description ? (
        <Text variant="subhead" color="secondary" style={styles.centered}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="primary" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[3],
    padding: theme.space[6],
  },
  centered: { textAlign: 'center' },
}));
