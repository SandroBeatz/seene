import { EmptyState, Screen } from '@/shared/ui';

export default function ClientsScreen() {
  return (
    <Screen padded={false}>
      <EmptyState
        icon="clients"
        title="Clients"
        description="Client management arrives in Phase 4."
      />
    </Screen>
  );
}
