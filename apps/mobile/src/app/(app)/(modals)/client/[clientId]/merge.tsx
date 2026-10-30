import { useLocalSearchParams } from 'expo-router';
import { useClientQuery } from '@/entities/client';
import { MergeClients } from '@/features/client-merge';
import { Screen, Skeleton } from '@/shared/ui';

export default function MergeClientScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const client = useClientQuery(clientId);
  if (!client.data) {
    return (
      <Screen>
        <Skeleton height={320} />
      </Screen>
    );
  }
  return <MergeClients client={client.data} />;
}
