/**
 * The person's name as the sign-in provider knows it (Google: given/family name,
 * else the full name split once). Used to prefill onboarding; empty for email sign-in.
 */
import type { Session } from '../api/session.api';

export interface AuthName {
  firstName: string;
  lastName: string;
}

export function nameFromUser(user: Session['user'] | undefined): AuthName {
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const text = (key: string) => (typeof meta[key] === 'string' ? (meta[key] as string).trim() : '');
  const given = text('given_name');
  const family = text('family_name');
  if (given || family) return { firstName: given, lastName: family };
  const [first = '', ...rest] = (text('full_name') || text('name')).split(/\s+/);
  return { firstName: first, lastName: rest.join(' ') };
}
