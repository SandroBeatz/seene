import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { QuickCreateStep } from '@/widgets/quick-create-flow';

export default function QuickCreateReviewScreen() {
  const { t } = useTranslation();
  return (
    <QuickCreateStep
      title={t('quickCreate.reviewTitle')}
      description={t('quickCreate.reviewDescription')}
      actionLabel={t('quickCreate.finish')}
      onAction={() => router.dismissTo('/')}
    />
  );
}
