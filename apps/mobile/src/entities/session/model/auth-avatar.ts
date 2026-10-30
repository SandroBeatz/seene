/**
 * The person's photo as the sign-in provider knows it (Google: `avatar_url` /
 * `picture`). Apple shares no photo, email sign-in has none: null. Google serves a
 * 96px thumbnail by default; ask for a size that stays sharp on the booking page.
 */
import type { Session } from '../api/session.api';

const GOOGLE_SIZE = /=s\d+-c$/;

export function avatarFromUser(user: Session['user'] | undefined): string | null {
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const url = [meta.avatar_url, meta.picture].find(
    (value): value is string => typeof value === 'string' && value.startsWith('https://'),
  );
  if (!url) return null;
  return GOOGLE_SIZE.test(url) ? url.replace(GOOGLE_SIZE, '=s512-c') : url;
}
