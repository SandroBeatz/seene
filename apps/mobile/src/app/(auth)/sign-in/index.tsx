import { StatusBar } from 'expo-status-bar';
import { AuthLanding } from '@/features/auth-login';

export default function AuthLandingScreen() {
  return (
    <>
      <StatusBar style="light" animated />
      <AuthLanding />
    </>
  );
}
