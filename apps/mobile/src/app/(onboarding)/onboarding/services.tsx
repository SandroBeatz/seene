import { useRouter } from 'expo-router';
import { ServicesStep } from '@/features/onboarding';

export default function OnboardingServicesScreen() {
  const router = useRouter();
  return (
    <ServicesStep
      onOpenService={() => router.push('/onboarding/service')}
      // Currency is set on step 3, right behind this one.
      onChangeCurrency={() => router.back()}
      onContinue={() => router.push('/onboarding/review')}
    />
  );
}
