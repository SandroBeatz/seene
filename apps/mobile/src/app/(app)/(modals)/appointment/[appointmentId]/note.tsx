import { useLocalSearchParams } from 'expo-router';
import { useAppointmentQuery } from '@/entities/appointment';
import { NoteEditor } from '@/features/appointment-actions';
import { Screen, Skeleton } from '@/shared/ui';

export default function AppointmentNoteScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const appointment = useAppointmentQuery(appointmentId);
  if (!appointment.data) {
    return (
      <Screen>
        <Skeleton height={160} />
      </Screen>
    );
  }
  return <NoteEditor appointment={appointment.data} />;
}
