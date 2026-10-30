import { useLocalSearchParams } from 'expo-router';
import { ClientForm, usePhoneCountry } from '@/features/client-form';
import { Screen, Skeleton } from '@/shared/ui';

/** Params of a new client started from a phone book contact. */
type Prefill = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthDay?: string;
  birthMonth?: string;
};

export default function NewClientScreen() {
  const phone = usePhoneCountry();
  const params = useLocalSearchParams<Prefill>();
  if (phone.isPending) {
    return (
      <Screen>
        <Skeleton height={320} />
      </Screen>
    );
  }
  const prefill = params.firstName
    ? {
        first_name: params.firstName,
        last_name: params.lastName || null,
        phone: params.phone || null,
        birth_day: params.birthDay ? Number(params.birthDay) : null,
        birth_month: params.birthMonth ? Number(params.birthMonth) : null,
      }
    : null;
  return <ClientForm defaultCountry={phone.country} prefill={prefill} />;
}
