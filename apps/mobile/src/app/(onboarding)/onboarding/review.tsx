import { useRouter } from 'expo-router';
import { ReviewStep } from '@/features/onboarding';

/** Each "Изменить" pops back to its step; the steps after it stay to be walked again. */
const STEP_ROUTE = {
  profile: '/onboarding/profile',
  professions: '/onboarding/professions',
  settings: '/onboarding/settings',
  services: '/onboarding/services',
} as const;

export default function OnboardingReviewScreen() {
  const router = useRouter();
  return (
    <ReviewStep
      onBack={() => router.back()}
      onEdit={(target) => router.dismissTo(STEP_ROUTE[target])}
      onCreate={() => router.push('/onboarding/creating')}
    />
  );
}
