import { useTranslation } from 'react-i18next';
import { EmptyState, Screen } from '@/shared/ui';

export default function AnalyticsScreen() {
  const { t } = useTranslation();

  return (
    <Screen padded={false} edges={['left', 'right']}>
      <EmptyState
        icon="analytics"
        title={t('tabs.analytics')}
        description={t('placeholders.analytics')}
      />
    </Screen>
  );
}
