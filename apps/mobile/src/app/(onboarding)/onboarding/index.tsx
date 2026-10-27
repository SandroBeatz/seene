import { Redirect } from 'expo-router';

/** Onboarding always starts at step 1; the persisted draft keeps what was typed. */
export default function OnboardingIndex() {
  return <Redirect href="/onboarding/profile" />;
}
