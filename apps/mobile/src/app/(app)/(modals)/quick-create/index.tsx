import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ClientStep, useQuickCreateDraft } from '@/widgets/quick-create-flow';

/**
 * Step 1. Opened for a known client ("Записать снова", the client profile): straight to
 * services. Opened from the calendar: the date step starts on that day, with the
 * tapped cell's time picked if the chosen services fit there.
 */
export default function QuickCreateClientScreen() {
  const { clientId, dayKey, start } = useLocalSearchParams<{
    clientId?: string;
    dayKey?: string;
    start?: string;
  }>();
  const setClient = useQuickCreateDraft((s) => s.setClient);
  const setDay = useQuickCreateDraft((s) => s.setDay);
  const setPreferredStart = useQuickCreateDraft((s) => s.setPreferredStart);
  const reset = useQuickCreateDraft((s) => s.reset);

  useEffect(() => {
    if (dayKey) setDay(dayKey);
    if (start) setPreferredStart(start);
    if (clientId) {
      setClient(clientId);
      router.push('/quick-create/services');
    }
    // The first step lives as long as the flow: closing it drops the draft.
    return reset;
  }, [clientId, dayKey, start, setClient, setDay, setPreferredStart, reset]);

  return <ClientStep />;
}
