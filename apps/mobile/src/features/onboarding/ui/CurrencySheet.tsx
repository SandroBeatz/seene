/** The currency sheet over the onboarding draft. */
import { useTranslation } from 'react-i18next';
import { CurrencySheet as Sheet } from '@/shared/ui';
import { useOnboardingDraft } from '../model/draft.store';

export function CurrencySheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const currency = useOnboardingDraft((state) => state.currency);
  const setSettings = useOnboardingDraft((state) => state.setSettings);
  return (
    <Sheet
      value={currency}
      onChange={(next) => setSettings({ currency: next })}
      hint={t('onboarding.currencySheet.hint')}
      onClose={onClose}
    />
  );
}
