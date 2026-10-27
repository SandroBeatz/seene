import { useRouter } from 'expo-router';
import { Welcome } from '@/features/auth-login';

export default function WelcomeScreen() {
  const router = useRouter();
  return <Welcome onOpenLanguage={() => router.push('/language')} />;
}
