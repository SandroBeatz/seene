import { useSessionStore } from '@/entities/session';
import { ErrorState, Screen } from '@/shared/ui';

export default function SessionErrorScreen() {
  const retry = useSessionStore((state) => state.retry);

  return (
    <Screen padded={false} edges={['top', 'right', 'bottom', 'left']}>
      <ErrorState onRetry={() => void retry()} />
    </Screen>
  );
}
