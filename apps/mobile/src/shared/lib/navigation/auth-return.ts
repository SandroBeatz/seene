import type { Href } from 'expo-router';

const INTERNAL_ORIGIN = 'https://internal.seene.invalid';
const PUBLIC_PATHS = [
  '/sign-in',
  '/onboarding',
  '/session-restoring',
  '/session-error',
  '/uikit',
  // Compatibility redirects are public too and must never become post-auth targets.
  '/email',
  '/welcome',
];

/** Accept only local app paths. This value may come from an external deep link. */
export function sanitizeReturnTo(value: string | null | undefined): Href | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return null;
  }

  try {
    const url = new URL(value, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN) return null;
    if (PUBLIC_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`))) {
      return null;
    }
    return `${url.pathname}${url.search}${url.hash}` as Href;
  } catch {
    return null;
  }
}
