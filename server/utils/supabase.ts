import { createClient } from '@supabase/supabase-js'

export function useSupabase() {
  const config = useRuntimeConfig()
  return createClient(config.supabaseUrl, config.supabasePublishableKey)
}
