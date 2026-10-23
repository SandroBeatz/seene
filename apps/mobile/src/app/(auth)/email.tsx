import { Redirect } from 'expo-router';

/** Temporary compatibility alias for the pre-navigation-audit URL. */
export default function LegacyEmailAuthRoute() {
  return <Redirect href="/sign-in/email" />;
}
