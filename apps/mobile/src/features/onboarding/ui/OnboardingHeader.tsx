/** Step header for the 4 onboarding steps: back, segmented progress, "N из 4". */
import { useTranslation } from 'react-i18next';
import { StepHeader } from '@/shared/ui';

export const ONBOARDING_STEP_COUNT = 4;

export interface OnboardingHeaderProps {
  /** 1-based. */
  step: number;
  onBack: () => void;
}

export function OnboardingHeader({ step, onBack }: OnboardingHeaderProps) {
  const { t } = useTranslation();
  return (
    <StepHeader
      step={step}
      total={ONBOARDING_STEP_COUNT}
      counterLabel={t('onboarding.step', { step, total: ONBOARDING_STEP_COUNT })}
      backLabel={t('common.back')}
      onBack={onBack}
    />
  );
}
