/**
 * "Not you?" on the booking confirm step: this device stops being trusted for
 * the master, so the next booking asks for a code again.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ username?: string }>(event)
  const supabase = useServiceSupabase()
  const masterUserId = await getMasterUserId(supabase, body.username)

  await revokeDeviceToken(event, supabase, masterUserId)

  return { success: true }
})
