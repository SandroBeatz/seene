/**
 * Step header for the 4 onboarding steps: back, segmented progress, "N из 4".
 * The layout floats it over the steps; each step pads its scroll content by
 * `useOnboardingHeaderInset()` so the title starts below it and scrolls under it.
 */
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUnistyles } from 'react-native-unistyles';
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

/** Height of the floating step header (safe area + top gap + its 40pt row). */
export function useOnboardingHeaderInset(): number {
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();
  return insets.top + theme.layout.topGap + theme.sizing.iconButton;
}
