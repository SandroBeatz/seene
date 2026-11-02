import { useEffect } from 'react';
import { usePersonalTimeDraft, WhenStep } from '@/widgets/personal-time-flow';

/** Step 1. The first step lives as long as the flow: closing it drops the draft. */
export default function PersonalTimeWhenScreen() {
  const reset = usePersonalTimeDraft((s) => s.reset);
  useEffect(() => reset, [reset]);
  return <WhenStep />;
}
