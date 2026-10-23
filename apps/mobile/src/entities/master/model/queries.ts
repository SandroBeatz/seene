/**
 * Master query hooks. `useUsernameAvailability` powers the live check in onboarding
 * Step 2; the actual profile/settings write is composed in the onboarding feature
 * (it also needs the session store), so it is not a hook here.
 */
import { useQuery } from '@tanstack/react-query';
import { checkUsernameAvailable } from '../api/master.api';

export const masterKeys = {
  all: ['master'] as const,
  usernameAvailable: (username: string) => [...masterKeys.all, 'username', username] as const,
};

/** Minimum length before we bother hitting the RPC. */
export const MIN_USERNAME_LENGTH = 3;
const USERNAME_PATTERN = /^[a-z0-9_.]+$/;

export function isUsernameSyntaxValid(username: string): boolean {
  const value = username.trim().toLowerCase();
  return value.length >= MIN_USERNAME_LENGTH && USERNAME_PATTERN.test(value);
}

export function useUsernameAvailability(username: string) {
  const normalized = username.trim().toLowerCase();
  return useQuery({
    queryKey: masterKeys.usernameAvailable(normalized),
    queryFn: () => checkUsernameAvailable(normalized),
    enabled: isUsernameSyntaxValid(normalized),
    staleTime: 60_000,
    retry: false,
  });
}
