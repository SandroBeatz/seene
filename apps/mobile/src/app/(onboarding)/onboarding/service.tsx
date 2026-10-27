import { useRouter } from 'expo-router';
import { ServiceSheet } from '@/features/onboarding';

export default function OnboardingServiceSheet() {
  const router = useRouter();
  return (
    <ServiceSheet
      onClose={() => router.back()}
      onOpenSection={() => router.push('/onboarding/service-section')}
      onOpenCategory={() => router.push('/onboarding/service-category')}
    />
  );
}
