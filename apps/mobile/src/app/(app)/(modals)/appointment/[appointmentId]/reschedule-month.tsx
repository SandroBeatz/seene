import { useLocalSearchParams } from 'expo-router';
import { useAppointmentQuery } from '@/entities/appointment';
import { Screen, Skeleton } from '@/shared/ui';
import { RescheduleMonthSheet } from '@/widgets/appointment-edit';

export default function AppointmentRescheduleMonthScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const appointment = useAppointmentQuery(appointmentId);
  if (!appointment.data) {
    return (
      <Screen>
        <Skeleton height={280} />
      </Screen>
    );
  }
  return <RescheduleMonthSheet appointment={appointment.data} />;
}
