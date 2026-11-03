/** The time zone sheet over the onboarding draft. */
import { TimezoneSheet as Sheet } from '@/shared/ui';
import { useOnboardingDraft } from '../model/draft.store';

export function TimezoneSheet({ onClose }: { onClose: () => void }) {
  const timezone = useOnboardingDraft((state) => state.timezone);
  const setSettings = useOnboardingDraft((state) => state.setSettings);
  return (
    <Sheet
      value={timezone}
      onChange={(next) => setSettings({ timezone: next })}
      onClose={onClose}
    />
  );
}
