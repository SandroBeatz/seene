import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ClientStep, useQuickCreateDraft } from '@/widgets/quick-create-flow';

/** Step 1. Opened for a known client ("Записать снова", the client profile): straight to services. */
export default function QuickCreateClientScreen() {
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();
  const setClient = useQuickCreateDraft((s) => s.setClient);
  const reset = useQuickCreateDraft((s) => s.reset);

  useEffect(() => {
    if (clientId) {
      setClient(clientId);
      router.push('/quick-create/services');
    }
    // The first step lives as long as the flow: closing it drops the draft.
    return reset;
  }, [clientId, setClient, reset]);

  return <ClientStep />;
}
