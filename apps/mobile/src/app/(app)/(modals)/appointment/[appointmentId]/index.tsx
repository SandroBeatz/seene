import { useLocalSearchParams } from 'expo-router';
import { AppointmentPreview } from '@/widgets/appointment-preview';

export default function AppointmentPreviewScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  return <AppointmentPreview appointmentId={appointmentId} />;
}
