import { Redirect } from 'expo-router';

/** Temporary compatibility alias for the pre-navigation-audit URL. */
export default function LegacyOnboardingRoute() {
  return <Redirect href="/onboarding" />;
}
