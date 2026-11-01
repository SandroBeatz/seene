import { useLocalSearchParams } from 'expo-router';
import { useAppointmentQuery } from '@/entities/appointment';
import { Screen, Skeleton } from '@/shared/ui';
import { RescheduleOwnTimeSheet } from '@/widgets/appointment-edit';

export default function AppointmentRescheduleTimeScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const appointment = useAppointmentQuery(appointmentId);
  if (!appointment.data) {
    return (
      <Screen>
        <Skeleton height={220} />
      </Screen>
    );
  }
  return <RescheduleOwnTimeSheet appointment={appointment.data} />;
}
