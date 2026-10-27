import { useRouter } from 'expo-router';
import { SectionSheet } from '@/features/onboarding';

export default function OnboardingServiceSectionSheet() {
  const router = useRouter();
  return <SectionSheet onBack={() => router.back()} />;
}
