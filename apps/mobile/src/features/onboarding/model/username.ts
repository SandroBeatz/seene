/**
 * Live status of the username field (step 1): syntax first, then a debounced
 * availability RPC once typing settles.
 */
import { useEffect, useState } from 'react';
import { isUsernameSyntaxValid, useUsernameAvailability } from '@/entities/master';

export type UsernameStatus = 'empty' | 'invalid' | 'checking' | 'free' | 'taken' | 'error';

const DEBOUNCE_MS = 400;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function useUsernameStatus(username: string): UsernameStatus {
  const settled = useDebouncedValue(username, DEBOUNCE_MS);
  const availability = useUsernameAvailability(settled);

  if (!username) return 'empty';
  if (!isUsernameSyntaxValid(username)) return 'invalid';
  if (settled !== username || availability.isPending) return 'checking';
  if (availability.isError) return 'error';
  return availability.data ? 'free' : 'taken';
}
