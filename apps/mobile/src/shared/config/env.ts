/**
 * Typed access to bundled public env vars (EXPO_PUBLIC_*). We warn (not throw) at
 * import so the app still boots without a filled-in .env.local during Phase 0; the
 * hard failure happens when the Supabase client is actually constructed/used.
 * Only ever expose the publishable (anon) key — never service_role.
 */
function readPublic(name: keyof NodeJS.ProcessEnv, value: string | undefined): string {
  if (!value && __DEV__) {
    console.warn(`[env] Missing ${name}. Copy .env.example → .env.local before hitting the API.`);
  }
  return value ?? '';
}

export const env = {
  supabaseUrl: readPublic('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: readPublic(
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
} as const;

/** Call before constructing the Supabase client to fail loudly on misconfiguration. */
export function assertSupabaseEnv(): void {
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    throw new Error(
      'Supabase env not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.',
    );
  }
}
