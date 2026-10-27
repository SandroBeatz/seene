import { useRouter } from 'expo-router';
import { ProfileStep } from '@/features/onboarding';

export default function OnboardingProfileScreen() {
  const router = useRouter();
  return <ProfileStep onNext={() => router.push('/onboarding/professions')} />;
}
