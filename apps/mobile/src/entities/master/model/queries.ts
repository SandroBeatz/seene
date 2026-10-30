/**
 * Master query hooks. `useUsernameAvailability` powers the live check in onboarding
 * Step 2; the actual profile/settings write is composed in the onboarding feature
 * (it also needs the session store), so it is not a hook here.
 */
import { useQuery } from '@tanstack/react-query';
import { checkUsernameAvailable, getMasterProfile, getMasterSettings } from '../api/master.api';

export const masterKeys = {
  all: ['master'] as const,
  usernameAvailable: (username: string) => [...masterKeys.all, 'username', username] as const,
  profile: (userId: string) => [...masterKeys.all, 'profile', userId] as const,
  settings: (userId: string) => [...masterKeys.all, 'settings', userId] as const,
};

export function useMasterProfileQuery(userId: string) {
  return useQuery({
    queryKey: masterKeys.profile(userId),
    queryFn: () => getMasterProfile(userId),
    enabled: !!userId,
  });
}

export function useMasterSettingsQuery(userId: string) {
  return useQuery({
    queryKey: masterKeys.settings(userId),
    queryFn: () => getMasterSettings(userId),
    enabled: !!userId,
  });
}

/** Minimum length before we bother hitting the RPC. */
export const MIN_USERNAME_LENGTH = 3;
/**
 * The page lives at seene/<username>. Same rule as the web
 * (apps/web/shared/utils/username.ts) and the `master_profile_username_format`
 * CHECK in the database: lowercase letters, digits, '_' and '-', 3-30 characters,
 * starting with a letter or digit, no dots, site paths reserved.
 */
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{2,29}$/;
const RESERVED_USERNAMES = new Set([
  'about',
  'admin',
  'api',
  'app',
  'assets',
  'blog',
  'book',
  'booking',
  'c',
  'calculator',
  'compare',
  'en',
  'fr',
  'help',
  'login',
  'master',
  'masters',
  'pricing',
  'privacy',
  'ru',
  'seene',
  'signup',
  'static',
  'support',
  'terms',
  'waitlist',
  'www',
]);

export function isUsernameSyntaxValid(username: string): boolean {
  const value = username.trim().toLowerCase();
  return USERNAME_PATTERN.test(value) && !RESERVED_USERNAMES.has(value);
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
