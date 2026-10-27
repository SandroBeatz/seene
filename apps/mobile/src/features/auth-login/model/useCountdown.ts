/**
 * Seconds-left countdown for "new code in 0:42"; `restart()` starts it again
 * after a resend. Counts against a wall-clock deadline, not ticks: iOS pauses JS
 * timers while the app is in the background (the master is in Mail fetching the
 * code), and the countdown must be right when they come back.
 */
import { useCallback, useEffect, useState } from 'react';

/** Supabase allows one email OTP per address roughly every 60 seconds. */
export const RESEND_COOLDOWN_SECONDS = 60;

export function useCountdown(seconds: number = RESEND_COOLDOWN_SECONDS) {
  const [deadline, setDeadline] = useState(() => Date.now() + seconds * 1000);
  const [now, setNow] = useState(() => Date.now());
  const left = Math.min(seconds, Math.max(0, Math.ceil((deadline - now) / 1000)));
  const done = left === 0;

  // Re-read the clock every second until the deadline passes.
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [done, deadline]);

  const restart = useCallback(() => {
    const start = Date.now();
    setNow(start);
    setDeadline(start + seconds * 1000);
  }, [seconds]);

  return { left, restart };
}

/** 42 → "0:42", 75 → "1:15". */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
