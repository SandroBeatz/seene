import { useLocalSearchParams } from 'expo-router';
import { ClientProfile } from '@/widgets/client-profile';

export default function ClientProfileScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  return <ClientProfile clientId={clientId} />;
}
