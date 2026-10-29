import { useRouter } from 'expo-router';
import { SettingsStep } from '@/features/onboarding';

export default function OnboardingSettingsScreen() {
  const router = useRouter();
  return (
    <SettingsStep
      onOpenTimezone={() => router.push('/onboarding/timezone')}
      onOpenCurrency={() => router.push('/onboarding/currency')}
      onOpenHours={() => router.push('/onboarding/hours')}
      onNext={() => router.push('/onboarding/services')}
    />
  );
}
