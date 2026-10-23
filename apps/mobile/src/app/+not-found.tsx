import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Screen } from '@/shared/ui';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <Screen padded={false} edges={['left', 'right']}>
      <Stack.Screen options={{ headerShown: true, title: t('navigation.notFound') }} />
      <EmptyState icon="error" title={t('navigation.notFoundDescription')} />
      <Link href="/" asChild>
        <Button label={t('navigation.goHome')} variant="secondary" />
      </Link>
    </Screen>
  );
}
