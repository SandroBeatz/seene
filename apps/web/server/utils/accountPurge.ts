import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/supabase'

const BUCKETS = ['avatars', 'master-media'] as const
const PAGE_SIZE = 1000

/** Every file under a folder of a bucket, including nested folders. */
async function listFiles(
  supabase: SupabaseClient<Database>,
  bucket: string,
  folder: string
): Promise<string[]> {
  const files: string[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, { limit: PAGE_SIZE, offset })
    if (error) throw error
    for (const entry of data) {
      const path = `${folder}/${entry.name}`
      // Storage marks a folder by the missing id.
      if (entry.id === null) files.push(...await listFiles(supabase, bucket, path))
      else files.push(path)
    }
    if (data.length < PAGE_SIZE) return files
  }
}

/**
 * Removes one master for good: files first (the database refuses direct deletes from
 * storage), then the rows, then the auth user, whose cascade takes the rest with the
 * profile. Any step that fails leaves the profile, so the next run tries again.
 */
export async function purgeAccount(supabase: SupabaseClient<Database>, userId: string) {
  for (const bucket of BUCKETS) {
    const files = await listFiles(supabase, bucket, userId)
    if (files.length === 0) continue
    const { error } = await supabase.storage.from(bucket).remove(files)
    if (error) throw error
  }

  const { error: dataError } = await supabase.rpc('purge_account_data', { p_user_id: userId })
  if (dataError) throw dataError

  const { error: userError } = await supabase.auth.admin.deleteUser(userId)
  if (userError) throw userError
}
