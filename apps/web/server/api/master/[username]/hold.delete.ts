/** Lets the held slot go when the client leaves the details step. */
export default defineEventHandler(async (event) => {
  const holderHash = readHolderHash(event)
  if (!holderHash) return { ok: true }

  const supabase = useServiceSupabase()
  const masterUserId = await getMasterUserId(supabase, getRouterParam(event, 'username'))

  const { error } = await supabase
    .from('slot_hold')
    .delete()
    .eq('master_user_id', masterUserId)
    .eq('holder_hash', holderHash)

  if (error) {
    throw createError({ statusCode: 500, message: 'Failed to release the slot' })
  }

  return { ok: true }
})
