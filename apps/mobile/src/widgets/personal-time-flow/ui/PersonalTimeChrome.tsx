/** The top of a "Личное время" step: the shared flow chrome, two steps. */
import { useTranslation } from 'react-i18next';
import { FlowStepChrome } from '@/shared/ui';

const STEP_COUNT = 2;

export function PersonalTimeChrome({ step, subtitle }: { step: number; subtitle: string }) {
  const { t } = useTranslation();
  return (
    <FlowStepChrome
      step={step}
      count={STEP_COUNT}
      subtitle={subtitle}
      title={t('personalTime.title')}
      closeLabel={t('common.close')}
      backLabel={t('common.back')}
      progressLabel={t('quickCreate.progressA11y', { step, count: STEP_COUNT })}
    />
  );
}
