/** A personal time sheet with no block to show: loading, failed to load, or gone. */
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui';

export interface BlockFallbackProps {
  query: { isPending: boolean; error: unknown; refetch: () => unknown };
}

export function BlockFallback({ query }: BlockFallbackProps) {
  const { t } = useTranslation();
  if (query.isPending) {
    return (
      <View style={styles.loading}>
        <Skeleton height={140} radius={16} />
      </View>
    );
  }
  if (query.error) {
    return (
      <ErrorState
        message={t(errorMessageKey(normalizeError(query.error)))}
        onRetry={() => void query.refetch()}
      />
    );
  }
  return <EmptyState icon="calendar" title={t('personalTime.preview.missing')} />;
}

const styles = StyleSheet.create((theme) => ({
  // Below the sheet's translucent bar.
  loading: { paddingTop: 100, paddingHorizontal: theme.space[4] },
}));
