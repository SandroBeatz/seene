import { useRouter } from 'expo-router';
import { CategorySheet } from '@/features/onboarding';

export default function OnboardingServiceCategorySheet() {
  const router = useRouter();
  return <CategorySheet onBack={() => router.back()} />;
}
