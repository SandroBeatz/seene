import { Redirect, useLocalSearchParams } from 'expo-router';
import { CodeStep } from '@/features/auth-login';

export default function CodeSignInScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  // Opened without an email (stale deep link) — start over from the email step.
  if (!email) return <Redirect href="/sign-in/email" />;
  return <CodeStep email={email} />;
}
