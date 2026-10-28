import { useRouter } from 'expo-router';
import { TimezoneSheet } from '@/features/onboarding';

export default function OnboardingTimezoneSheet() {
  const router = useRouter();
  return <TimezoneSheet onClose={() => router.back()} />;
}
