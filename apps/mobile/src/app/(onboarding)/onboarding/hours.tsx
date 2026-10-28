import { useRouter } from 'expo-router';
import { HoursSheet } from '@/features/onboarding';

export default function OnboardingHoursSheet() {
  const router = useRouter();
  return <HoursSheet onClose={() => router.back()} />;
}
