import { Link, Stack } from 'expo-router';
import { Button, EmptyState, Screen } from '@/shared/ui';

export default function NotFoundScreen() {
  return (
    <Screen padded={false}>
      <Stack.Screen options={{ title: 'Not found' }} />
      <EmptyState icon="error" title="This screen doesn't exist." />
      <Link href="/" asChild>
        <Button label="Go home" variant="secondary" />
      </Link>
    </Screen>
  );
}
