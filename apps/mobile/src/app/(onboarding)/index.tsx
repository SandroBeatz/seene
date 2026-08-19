import { EmptyState, Screen } from '@/shared/ui';

// Placeholder — the mandatory 5-step onboarding wizard is Phase 1.
export default function OnboardingScreen() {
  return (
    <Screen padded={false}>
      <EmptyState title="Onboarding" description="The 5-step setup wizard arrives in Phase 1." />
    </Screen>
  );
}
