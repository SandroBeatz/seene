import { useRouter } from 'expo-router';
import { EmailStep } from '@/features/auth-login';

export default function EmailSignInScreen() {
  const router = useRouter();
  return (
    <EmailStep
      onBack={() => router.back()}
      onCodeSent={(email) => router.push({ pathname: '/sign-in/code', params: { email } })}
    />
  );
}
