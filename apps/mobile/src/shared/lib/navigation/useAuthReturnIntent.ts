import { useCallback, useEffect, useRef, useState } from 'react';
import * as Linking from 'expo-linking';
import type { Href } from 'expo-router';
import { sanitizeReturnTo } from './auth-return';

export interface AuthReturnIntent {
  returnTo: Href | null;
  clearReturnTo: () => void;
}

/**
 * Remembers an incoming protected deep link while auth/onboarding is incomplete.
 * It is scoped to the mounted root layout and never mirrors current router state.
 */
export function useAuthReturnIntent(shouldCapture: boolean): AuthReturnIntent {
  const linkingUrl = Linking.useLinkingURL();
  const handledUrl = useRef<string | null>(null);
  const [returnTo, setReturnTo] = useState<Href | null>(null);

  useEffect(() => {
    if (!linkingUrl || handledUrl.current === linkingUrl) return;
    handledUrl.current = linkingUrl;
    // Mark links seen while authenticated as handled so an explicit later sign-out
    // cannot turn the app's old launch URL into a post-auth return target.
    if (!shouldCapture) return;

    const parsed = Linking.parse(linkingUrl);
    const path = parsed.path ? `/${parsed.path.replace(/^\/+/, '')}` : '/';
    const query = toSearchParams(parsed.queryParams);
    const safeHref = sanitizeReturnTo(`${path}${query}`);
    if (!safeHref) return;

    // Linking is an external source. Defer the state update so the effect remains
    // a synchronization boundary rather than creating a render cascade.
    const task = setTimeout(() => setReturnTo(safeHref), 0);
    return () => clearTimeout(task);
  }, [linkingUrl, shouldCapture]);

  const clearReturnTo = useCallback(() => setReturnTo(null), []);
  return { returnTo, clearReturnTo };
}

function toSearchParams(query: Linking.QueryParams | null): string {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  });
  const value = params.toString();
  return value ? `?${value}` : '';
}
