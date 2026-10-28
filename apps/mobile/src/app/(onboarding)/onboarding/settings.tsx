import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SettingsStep, useCompleteOnboarding } from '@/features/onboarding';
import { errorMessageKey } from '@/shared/api/errors';

export default function OnboardingSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const complete = useCompleteOnboarding();

  // Temporary until the review screen lands: finishing here creates the profile.
  return (
    <SettingsStep
      onOpenTimezone={() => router.push('/onboarding/timezone')}
      onOpenCurrency={() => router.push('/onboarding/currency')}
      onOpenHours={() => router.push('/onboarding/hours')}
      submitting={complete.isPending}
      onNext={() => complete.mutate(undefined, { onError: (e) => Alert.alert(t(errorMessageKey(e))) })}
    />
  );
}
