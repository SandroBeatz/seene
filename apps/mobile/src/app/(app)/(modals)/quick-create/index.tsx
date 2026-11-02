import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ClientStep, useQuickCreateDraft } from '@/widgets/quick-create-flow';

/**
 * Step 1. Opened for a known client ("Записать снова", the client profile): straight to
 * services. Opened from the calendar: the date step starts on that day, at the
 * tapped cell's time if there is one (kept like a typed time: services don't reset it).
 */
export default function QuickCreateClientScreen() {
  const { clientId, dayKey, start } = useLocalSearchParams<{
    clientId?: string;
    dayKey?: string;
    start?: string;
  }>();
  const setClient = useQuickCreateDraft((s) => s.setClient);
  const setDay = useQuickCreateDraft((s) => s.setDay);
  const setStart = useQuickCreateDraft((s) => s.setStart);
  const reset = useQuickCreateDraft((s) => s.reset);

  useEffect(() => {
    if (dayKey) setDay(dayKey);
    if (start) setStart(start, true);
    if (clientId) {
      setClient(clientId);
      router.push('/quick-create/services');
    }
    // The first step lives as long as the flow: closing it drops the draft.
    return reset;
  }, [clientId, dayKey, start, setClient, setDay, setStart, reset]);

  return <ClientStep />;
}
