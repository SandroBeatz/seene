import { useRouter } from 'expo-router';
import { ServicesStep } from '@/features/onboarding';

export default function OnboardingServicesScreen() {
  const router = useRouter();
  return (
    <ServicesStep
      onOpenService={() => router.push('/onboarding/service')}
      onContinue={() => router.push('/onboarding/settings')}
    />
  );
}
