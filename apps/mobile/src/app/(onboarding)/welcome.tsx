import { useRouter } from 'expo-router';
import { OnboardingWizard } from '@/features/onboarding';

export default function OnboardingScreen() {
  const router = useRouter();
  return <OnboardingWizard onComplete={() => router.replace('/(tabs)')} />;
}
