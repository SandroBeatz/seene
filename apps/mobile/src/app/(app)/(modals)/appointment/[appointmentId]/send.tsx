import { useLocalSearchParams } from 'expo-router';
import { useAppointmentQuery } from '@/entities/appointment';
import type { MessageKind } from '@/entities/message-template';
import { SendToClientSheet } from '@/features/appointment-actions';
import { Screen, Skeleton } from '@/shared/ui';

export default function AppointmentSendScreen() {
  const { appointmentId, kind, event } = useLocalSearchParams<{
    appointmentId: string;
    kind: MessageKind;
    event: string;
  }>();
  const appointment = useAppointmentQuery(appointmentId);
  if (!appointment.data) {
    return (
      <Screen>
        <Skeleton height={160} />
      </Screen>
    );
  }
  return <SendToClientSheet appointment={appointment.data} kind={kind} event={event} />;
}
