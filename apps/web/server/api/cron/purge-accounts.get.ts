import { purgeAccount } from '../../utils/accountPurge'

const GRACE_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

/** Daily: deletes the accounts whose 30 days to change their mind have passed. */
export default defineEventHandler(async (event) => {
  const { cronSecret } = useRuntimeConfig(event)
  if (!cronSecret || getHeader(event, 'authorization') !== `Bearer ${cronSecret}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const supabase = useServiceSupabase()
  const { data: due, error } = await supabase
    .from('master_profile')
    .select('user_id')
    .lt('deactivated_at', new Date(Date.now() - GRACE_DAYS * DAY_MS).toISOString())
  if (error) throw createError({ statusCode: 500, message: error.message })

  let failed = 0
  for (const { user_id: userId } of due) {
    try {
      await purgeAccount(supabase, userId)
    } catch (purgeError) {
      failed += 1
      console.error('account purge failed', userId, purgeError)
    }
  }

  if (failed > 0) {
    throw createError({ statusCode: 500, message: `${failed} of ${due.length} purges failed` })
  }
  return { purged: due.length }
})
