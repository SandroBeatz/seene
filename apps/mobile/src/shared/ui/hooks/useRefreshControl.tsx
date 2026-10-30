/**
 * Pull-to-refresh that spins only while the master's pull is being served: the
 * queries' own background refetches (focus, mount, invalidation) never show it.
 * Tinted from the theme so the spinner is visible in dark mode too.
 */
import { useState } from 'react';
import { RefreshControl } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

export function useRefreshControl(onRefresh: () => Promise<unknown>) {
  const { theme } = useUnistyles();
  const [refreshing, setRefreshing] = useState(false);
  return (
    <RefreshControl
      refreshing={refreshing}
      tintColor={theme.colors.content.secondary}
      colors={[theme.colors.content.secondary]}
      progressBackgroundColor={theme.colors.bg.elevated}
      onRefresh={async () => {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }}
    />
  );
}
