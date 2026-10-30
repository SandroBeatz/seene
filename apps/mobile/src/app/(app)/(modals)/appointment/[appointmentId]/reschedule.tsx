import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppointmentQuery } from '@/entities/appointment';
import {
  parseStoredSchedule,
  useMasterProfileQuery,
  useMasterSettingsQuery,
} from '@/entities/master';
import { useUserId } from '@/entities/session';
import { RescheduleEditor } from '@/features/appointment-actions';
import { isSupportedLocale } from '@/shared/lib/i18n';
import { deviceTimeZone } from '@/shared/lib/time-zone';
import { Screen, Skeleton } from '@/shared/ui';

export default function AppointmentRescheduleScreen() {
  const { i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const userId = useUserId() ?? '';
  const appointment = useAppointmentQuery(appointmentId);
  const profile = useMasterProfileQuery(userId);
  const settings = useMasterSettingsQuery(userId);

  if (!appointment.data || profile.isPending || settings.isPending) {
    return (
      <Screen>
        <Skeleton height={320} />
      </Screen>
    );
  }
  const schedule = parseStoredSchedule(profile.data?.schedule);
  return (
    <RescheduleEditor
      appointment={appointment.data}
      zone={schedule?.timezone ?? deviceTimeZone()}
      schedule={schedule}
      stepMinutes={settings.data?.calendar_slot_step_minutes ?? 30}
      timeFormat={settings.data?.time_format === 12 ? 12 : 24}
      locale={locale}
    />
  );
}
