import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ServicesStep, useCompleteOnboarding } from '@/features/onboarding';
import { errorMessageKey } from '@/shared/api/errors';

export default function OnboardingServicesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const complete = useCompleteOnboarding();
  const onError = { onError: (e: Parameters<typeof errorMessageKey>[0]) => Alert.alert(t(errorMessageKey(e))) };

  // Temporary until step 4 lands: finishing here creates the profile.
  return (
    <ServicesStep
      onOpenService={() => router.push('/onboarding/service')}
      submitting={complete.isPending}
      onNext={() => complete.mutate({}, onError)}
      onSkip={() => complete.mutate({ skipServices: true }, onError)}
    />
  );
}
