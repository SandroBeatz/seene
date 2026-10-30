import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppointmentQuery } from '@/entities/appointment';
import { useMasterSettingsQuery } from '@/entities/master';
import { useServicesQuery } from '@/entities/service';
import { useUserId } from '@/entities/session';
import { ServicesEditor } from '@/features/appointment-actions';
import { currencySymbol } from '@/shared/lib/formats';
import { isSupportedLocale } from '@/shared/lib/i18n';
import { Screen, Skeleton } from '@/shared/ui';

export default function AppointmentServicesScreen() {
  const { i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const userId = useUserId() ?? '';
  const appointment = useAppointmentQuery(appointmentId);
  const services = useServicesQuery(userId);
  const settings = useMasterSettingsQuery(userId);

  if (!appointment.data || !services.data || settings.isPending) {
    return (
      <Screen>
        <Skeleton height={320} />
      </Screen>
    );
  }
  const currency = settings.data?.currency ?? 'EUR';
  return (
    <ServicesEditor
      appointment={appointment.data}
      services={services.data}
      currency={currency}
      currencyLabel={currencySymbol(currency, locale)}
      locale={locale}
    />
  );
}
