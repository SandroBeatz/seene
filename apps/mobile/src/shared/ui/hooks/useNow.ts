import { useEffect, useState } from 'react';

/**
 * Current time (epoch ms), refreshed on the boundary of every `stepMs` — every
 * minute by default (the "now" line, past dimming), every second for a timer.
 */
export function useNow(stepMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(
      () => {
        setNow(Date.now());
        interval = setInterval(() => setNow(Date.now()), stepMs);
      },
      stepMs - (Date.now() % stepMs),
    );
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [stepMs]);
  return now;
}
