import { router } from 'expo-router';
import { CreatingStep } from '@/features/onboarding';

/** The onboarding "creating" animation over the saved draft; writes nothing. */
export default function UIKitCreatingPreview() {
  return <CreatingStep preview onBack={() => router.back()} />;
}
