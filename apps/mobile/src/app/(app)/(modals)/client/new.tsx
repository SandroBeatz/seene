import { ClientForm, usePhoneCountry } from '@/features/client-form';
import { Screen, Skeleton } from '@/shared/ui';

export default function NewClientScreen() {
  const phone = usePhoneCountry();
  if (phone.isPending) {
    return (
      <Screen>
        <Skeleton height={320} />
      </Screen>
    );
  }
  return <ClientForm defaultCountry={phone.country} />;
}
