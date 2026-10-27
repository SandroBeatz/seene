import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ProfessionsStep, useCompleteOnboarding } from '@/features/onboarding';
import { errorMessageKey } from '@/shared/api/errors';

export default function OnboardingProfessionsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const complete = useCompleteOnboarding();

  // Temporary until steps 3–4 land: finishing here creates the profile.
  return (
    <ProfessionsStep
      onBack={() => router.back()}
      submitting={complete.isPending}
      onNext={() =>
        complete.mutate(undefined, { onError: (e) => Alert.alert(t(errorMessageKey(e))) })
      }
    />
  );
}
