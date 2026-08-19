/**
 * The Supabase client — RN-configured. This is the ONLY module that may import
 * `@supabase/supabase-js`, and it may ONLY be imported by an entity's api file
 * (entities → x → api → x.api.ts), enforced by ESLint. See docs/api-layer.md §1.
 */
import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { assertSupabaseEnv, env } from '@/shared/config/env';
import type { Database } from './database.types';
import { sessionStorageAdapter } from './session-storage';

assertSupabaseEnv();

export const supabase = createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    storage: sessionStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // no browser URL to parse in RN
    flowType: 'pkce', // for native OAuth
  },
});

// Refresh the session only while the app is foregrounded.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
