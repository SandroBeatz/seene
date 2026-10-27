import { useRouter } from 'expo-router';
import { ProfessionsStep } from '@/features/onboarding';

export default function OnboardingProfessionsScreen() {
  const router = useRouter();
  return <ProfessionsStep onNext={() => router.push('/onboarding/services')} />;
}
