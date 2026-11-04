import { useLocalSearchParams } from 'expo-router';
import { useAppointmentQuery } from '@/entities/appointment';
import { VisitDetailsSheet } from '@/features/appointment-actions';
import { Screen, Skeleton } from '@/shared/ui';

export default function AppointmentDetailsScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const appointment = useAppointmentQuery(appointmentId);
  if (!appointment.data) {
    return (
      <Screen>
        <Skeleton height={160} />
      </Screen>
    );
  }
  return <VisitDetailsSheet appointment={appointment.data} />;
}
