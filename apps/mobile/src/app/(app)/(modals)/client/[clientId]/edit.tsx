import { useLocalSearchParams } from 'expo-router';
import { useClientQuery } from '@/entities/client';
import { ClientForm, usePhoneCountry } from '@/features/client-form';
import { Screen, Skeleton } from '@/shared/ui';

export default function EditClientScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const client = useClientQuery(clientId);
  const phone = usePhoneCountry();
  if (!client.data || phone.isPending) {
    return (
      <Screen>
        <Skeleton height={320} />
      </Screen>
    );
  }
  return <ClientForm client={client.data} defaultCountry={phone.country} />;
}
