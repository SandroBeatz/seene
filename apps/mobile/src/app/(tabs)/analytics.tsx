import { EmptyState, Screen } from '@/shared/ui';

export default function AnalyticsScreen() {
  return (
    <Screen padded={false}>
      <EmptyState
        icon="analytics"
        title="Analytics"
        description="Dashboard + charts arrive in Phase 5."
      />
    </Screen>
  );
}
