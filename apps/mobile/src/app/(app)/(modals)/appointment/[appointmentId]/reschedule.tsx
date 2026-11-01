import { useLocalSearchParams } from 'expo-router';
import { useAppointmentQuery } from '@/entities/appointment';
import { Screen, Skeleton } from '@/shared/ui';
import { RescheduleSheet } from '@/widgets/appointment-edit';

export default function AppointmentRescheduleScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const appointment = useAppointmentQuery(appointmentId);
  if (!appointment.data) {
    return (
      <Screen>
        <Skeleton height={320} />
      </Screen>
    );
  }
  return <RescheduleSheet appointment={appointment.data} />;
}
