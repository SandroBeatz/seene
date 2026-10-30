import { useTranslation } from 'react-i18next';
import { EmptyState, Screen } from '@/shared/ui';

export default function CalendarScreen() {
  const { t } = useTranslation();

  return (
    <Screen padded={false} edges={['left', 'right']}>
      <EmptyState
        icon="calendar"
        title={t('tabs.calendar')}
        description={t('placeholders.calendar')}
      />
    </Screen>
  );
}
