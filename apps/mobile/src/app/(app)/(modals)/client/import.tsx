import { usePhoneCountry } from '@/features/client-form';
import { ImportContacts } from '@/features/client-import';
import { Screen, Skeleton } from '@/shared/ui';

export default function ImportClientsScreen() {
  const phone = usePhoneCountry();
  if (phone.isPending) {
    return (
      <Screen>
        <Skeleton height={320} />
      </Screen>
    );
  }
  return <ImportContacts country={phone.country} />;
}
