import { router } from 'expo-router';
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
        actionLabel={t('navigation.openSharedAppointment')}
        onAction={() =>
          router.push({
            pathname: '/(app)/(tabs)/(calendar)/appointments/[appointmentId]',
            params: { appointmentId: 'demo-appointment', source: 'calendar' },
          })
        }
      />
    </Screen>
  );
}
