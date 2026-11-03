/**
 * Master query hooks. `useUsernameAvailability` powers the live check in onboarding
 * Step 2; the actual profile/settings write is composed in the onboarding feature
 * (it also needs the session store), so it is not a hook here.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  checkUsernameAvailable,
  getMasterProfile,
  getMasterSettings,
  getPortfolioCount,
  removeMasterCover,
  updateMasterProfile,
  updateMasterSettings,
  updateMasterTimezone,
  updateMasterWeek,
  uploadMasterImage,
} from '../api/master.api';
import { toStoredSchedule } from '../lib/schedule';
import type {
  MasterImageKind,
  MasterProfile,
  MasterProfilePatch,
  MasterSettings,
  MasterSettingsPatch,
  WeeklySchedule,
} from './types';

export const masterKeys = {
  all: ['master'] as const,
  usernameAvailable: (username: string) => [...masterKeys.all, 'username', username] as const,
  profile: (userId: string) => [...masterKeys.all, 'profile', userId] as const,
  settings: (userId: string) => [...masterKeys.all, 'settings', userId] as const,
  portfolioCount: (userId: string) => [...masterKeys.all, 'portfolio-count', userId] as const,
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

/** Saves settings; the screen shows the new value at once and returns if the write fails. */
export function useUpdateMasterSettings(userId: string) {
  const queryClient = useQueryClient();
  const key = masterKeys.settings(userId);
  return useMutation({
    mutationFn: (patch: MasterSettingsPatch) => updateMasterSettings(userId, patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MasterSettings | null>(key);
      if (previous) queryClient.setQueryData(key, { ...previous, ...patch });
      return { previous };
    },
    onError: (_error, _patch, context) => queryClient.setQueryData(key, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

/** Saves the time zone the same way. */
export function useUpdateMasterTimezone(userId: string) {
  const queryClient = useQueryClient();
  const key = masterKeys.profile(userId);
  return useMutation({
    mutationFn: async (timezone: string) => {
      const current = queryClient.getQueryData<MasterProfile | null>(key);
      if (!current) throw new Error('profile is not loaded');
      await updateMasterTimezone(userId, current.schedule, timezone);
    },
    onMutate: async (timezone) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MasterProfile | null>(key);
      if (previous) {
        const schedule = { ...(previous.schedule as Record<string, unknown>), timezone };
        queryClient.setQueryData(key, { ...previous, schedule });
      }
      return { previous };
    },
    onError: (_error, _timezone, context) => queryClient.setQueryData(key, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

/** Saves the working week, optimistically: a day's switch answers at once. */
export function useUpdateMasterWeek(userId: string) {
  const queryClient = useQueryClient();
  const key = masterKeys.profile(userId);
  return useMutation({
    mutationFn: async (week: WeeklySchedule) => {
      const current = queryClient.getQueryData<MasterProfile | null>(key);
      if (!current) throw new Error('profile is not loaded');
      await updateMasterWeek(userId, current.schedule, toStoredSchedule(week, '').days);
    },
    onMutate: async (week) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MasterProfile | null>(key);
      if (previous) {
        const days = toStoredSchedule(week, '').days;
        const schedule = { ...(previous.schedule as Record<string, unknown>), days };
        queryClient.setQueryData(key, { ...previous, schedule });
      }
      return { previous };
    },
    onError: (_error, _week, context) => queryClient.setQueryData(key, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

/** Saves profile fields. Not optimistic: the sheet waits, then closes on the saved value. */
export function useUpdateMasterProfile(userId: string) {
  const queryClient = useQueryClient();
  const key = masterKeys.profile(userId);
  return useMutation({
    mutationFn: (patch: MasterProfilePatch) => updateMasterProfile(userId, patch),
    onSuccess: async (_data, patch) => {
      queryClient.setQueryData<MasterProfile | null>(key, (current) =>
        current ? { ...current, ...patch } : current,
      );
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useUploadMasterImage(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { kind: MasterImageKind; uri: string; mimeType: string }) =>
      uploadMasterImage(userId, input.kind, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: masterKeys.profile(userId) }),
  });
}

export function useRemoveMasterCover(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => removeMasterCover(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: masterKeys.profile(userId) }),
  });
}

export function useMasterPortfolioCount(userId: string) {
  return useQuery({
    queryKey: masterKeys.portfolioCount(userId),
    queryFn: () => getPortfolioCount(userId),
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
