import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { QuickCreateStep } from '@/widgets/quick-create-flow';

export default function QuickCreateServicesScreen() {
  const { t } = useTranslation();
  return (
    <QuickCreateStep
      title={t('quickCreate.servicesTitle')}
      description={t('quickCreate.servicesDescription')}
      actionLabel={t('common.continue')}
      onAction={() => router.push('/quick-create/date-time')}
    />
  );
}
