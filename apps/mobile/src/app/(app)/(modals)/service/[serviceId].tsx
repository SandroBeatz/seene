import { useLocalSearchParams } from 'expo-router';
import { ServiceSheet } from '@/widgets/service-list';

export default function EditServiceRoute() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  return <ServiceSheet serviceId={serviceId} />;
}
