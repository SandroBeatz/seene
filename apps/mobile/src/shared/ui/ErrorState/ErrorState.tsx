/**
 * Error-state surface: icon + human message (from normalized errors) + retry.
 * Screens render this on query `error` (docs/design-system.md §6, api-layer.md §7).
 */
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
import { Text } from '@/shared/ui/Text';

export interface ErrorStateProps {
  /** Pre-resolved human message; falls back to the generic i18n error. */
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Icon name="error" size={32} color="feedback.danger" />
      <Text variant="headline" style={styles.centered}>
        {t('states.errorTitle')}
      </Text>
      <Text variant="subhead" color="secondary" style={styles.centered}>
        {message ?? t('errors.unknown')}
      </Text>
      {onRetry ? <Button label={t('common.retry')} onPress={onRetry} variant="secondary" /> : null}
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
