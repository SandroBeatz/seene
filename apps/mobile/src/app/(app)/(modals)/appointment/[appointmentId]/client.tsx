import { useLocalSearchParams } from 'expo-router';
import { useAppointmentQuery } from '@/entities/appointment';
import { Screen, Skeleton } from '@/shared/ui';
import { ChangeClientSheet } from '@/widgets/appointment-edit';

export default function AppointmentClientScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const appointment = useAppointmentQuery(appointmentId);
  if (!appointment.data) {
    return (
      <Screen>
        <Skeleton height={320} />
      </Screen>
    );
  }
  return <ChangeClientSheet appointment={appointment.data} />;
}
