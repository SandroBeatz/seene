import { useLocalSearchParams } from 'expo-router';
import { ClientForm, usePhoneCountry } from '@/features/client-form';
import { useClientHandoff } from '@/widgets/appointment-edit';
import { useQuickCreateDraft } from '@/widgets/quick-create-flow';
import { Screen, Skeleton } from '@/shared/ui';

/** Params of a new client started from a phone book contact. */
type Prefill = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthDay?: string;
  birthMonth?: string;
  /**
   * `appointment`: opened from "Новая запись" — the new client is picked for it.
   * `appointment-client`: opened while changing a visit's client — it goes to the visit.
   */
  for?: string;
};

export default function NewClientScreen() {
  const phone = usePhoneCountry();
  const params = useLocalSearchParams<Prefill>();
  const setClient = useQuickCreateDraft((s) => s.setClient);
  const handOff = useClientHandoff((s) => s.put);
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
  return (
    <ClientForm
      defaultCountry={phone.country}
      prefill={prefill}
      onCreated={
        params.for === 'appointment'
          ? (client) => setClient(client.id, true)
          : params.for === 'appointment-client'
            ? (client) => handOff(client.id)
            : undefined
      }
    />
  );
}
