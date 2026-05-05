import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/supabase'

export function useSupabase() {
  const config = useRuntimeConfig()
  return createClient<Database>(config.supabaseUrl, config.supabasePublishableKey)
}

export function useServiceSupabase() {
  const config = useRuntimeConfig()

  if (!config.supabaseServiceRoleKey) {
    throw createError({ statusCode: 500, message: 'Supabase service role key is not configured' })
  }

  return createClient<Database>(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
