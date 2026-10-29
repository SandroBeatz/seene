import { useRouter } from 'expo-router';
import { CreatingStep } from '@/features/onboarding';

export default function OnboardingCreatingScreen() {
  const router = useRouter();
  return <CreatingStep onBack={() => router.back()} />;
}
