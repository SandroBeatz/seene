import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ClientStep, useQuickCreateDraft } from '@/widgets/quick-create-flow';

/**
 * Step 1. Opened for a known client ("Записать снова", the client profile): straight to
 * services. Opened from a day of the calendar: the date step starts on that day.
 */
export default function QuickCreateClientScreen() {
  const { clientId, dayKey } = useLocalSearchParams<{ clientId?: string; dayKey?: string }>();
  const setClient = useQuickCreateDraft((s) => s.setClient);
  const setDay = useQuickCreateDraft((s) => s.setDay);
  const reset = useQuickCreateDraft((s) => s.reset);

  useEffect(() => {
    if (dayKey) setDay(dayKey);
    if (clientId) {
      setClient(clientId);
      router.push('/quick-create/services');
    }
    // The first step lives as long as the flow: closing it drops the draft.
    return reset;
  }, [clientId, dayKey, setClient, setDay, reset]);

  return <ClientStep />;
}
