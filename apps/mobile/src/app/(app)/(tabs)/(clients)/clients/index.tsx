import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EmptyState, Screen } from '@/shared/ui';

export default function ClientsScreen() {
  const { t } = useTranslation();

  return (
    <Screen padded={false} edges={['left', 'right']}>
      <EmptyState
        icon="clients"
        title={t('tabs.clients')}
        description={t('placeholders.clients')}
        actionLabel={t('navigation.openDynamicClient')}
        onAction={() =>
          router.push({
            pathname: '/(app)/(tabs)/(clients)/clients/[clientId]',
            params: { clientId: 'demo-client' },
          })
        }
      />
    </Screen>
  );
}
