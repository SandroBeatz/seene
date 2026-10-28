import { useRouter } from 'expo-router';
import { CurrencySheet } from '@/features/onboarding';

export default function OnboardingCurrencySheet() {
  const router = useRouter();
  return <CurrencySheet onClose={() => router.back()} />;
}
