import { useLocalSearchParams } from 'expo-router';
import { useClientQuery } from '@/entities/client';
import { ClientNoteEditor } from '@/features/client-form';
import { Screen, Skeleton } from '@/shared/ui';

export default function ClientNoteScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const client = useClientQuery(clientId);
  if (!client.data) {
    return (
      <Screen>
        <Skeleton height={160} />
      </Screen>
    );
  }
  return <ClientNoteEditor client={client.data} />;
}
