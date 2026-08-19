import { EmptyState, Screen } from '@/shared/ui';

// Placeholder — real auth (email+password, native Google; Apple gated off) is Phase 1.
export default function LoginScreen() {
  return (
    <Screen padded={false}>
      <EmptyState title="Sign in" description="Auth screens arrive in Phase 1." />
    </Screen>
  );
}
