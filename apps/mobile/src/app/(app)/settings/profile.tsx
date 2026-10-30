import { useTranslation } from 'react-i18next';
import { EmptyState, Screen } from '@/shared/ui';

export default function ProfileSettingsScreen() {
  const { t } = useTranslation();
  return (
    <Screen padded={false} edges={['left', 'right']}>
      <EmptyState
        icon="settings"
        title={t('navigation.profileSettings')}
        description={t('placeholders.profileSettings')}
      />
    </Screen>
  );
}
