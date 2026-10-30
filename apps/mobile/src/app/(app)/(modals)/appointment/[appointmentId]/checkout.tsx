import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppointmentQuery } from '@/entities/appointment';
import { useClientQuery } from '@/entities/client';
import {
  parseStoredSchedule,
  useMasterProfileQuery,
  useMasterSettingsQuery,
} from '@/entities/master';
import { useServicesQuery } from '@/entities/service';
import { useUserId } from '@/entities/session';
import { CheckoutEditor } from '@/features/appointment-actions';
import { currencySymbol } from '@/shared/lib/formats';
import { isSupportedLocale } from '@/shared/lib/i18n';
import { deviceTimeZone } from '@/shared/lib/time-zone';
import { Screen, Skeleton } from '@/shared/ui';

export default function AppointmentCheckoutScreen() {
  const { i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const userId = useUserId() ?? '';
  const appointment = useAppointmentQuery(appointmentId);
  const client = useClientQuery(appointment.data?.client_id);
  const services = useServicesQuery(userId);
  const profile = useMasterProfileQuery(userId);
  const settings = useMasterSettingsQuery(userId);

  if (!appointment.data || !services.data || profile.isPending || settings.isPending) {
    return (
      <Screen>
        <Skeleton height={320} />
      </Screen>
    );
  }
  const currency = settings.data?.currency ?? 'EUR';
  return (
    <CheckoutEditor
      appointment={appointment.data}
      services={services.data}
      clientName={[client.data?.first_name, client.data?.last_name].filter(Boolean).join(' ')}
      zone={parseStoredSchedule(profile.data?.schedule)?.timezone ?? deviceTimeZone()}
      currency={currency}
      currencyLabel={currencySymbol(currency, locale)}
      timeFormat={settings.data?.time_format === 12 ? 12 : 24}
      locale={locale}
    />
  );
}
