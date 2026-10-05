/**
 * Lookup used by the booking confirm step: is this phone a known client of the
 * master, and has it already been confirmed by SMS (then no OTP is needed)?
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const phone = normalizePhone(query.phone)
  const username = typeof query.username === 'string' ? query.username.trim() : null
  const supabase = useServiceSupabase()

  if (!username) {
    throw createError({ statusCode: 400, message: 'Username is required' })
  }

  const [{ data: profile }, verified] = await Promise.all([
    supabase.from('master_profile').select('user_id').eq('username', username).maybeSingle(),
    isPhoneVerified(supabase, phone)
  ])

  if (!profile) {
    throw createError({ statusCode: 404, message: 'Master not found' })
  }

  const { data: client, error } = await supabase
    .from('client')
    .select('first_name')
    .eq('user_id', profile.user_id)
    .in('phone', phoneLookupKeys(phone))
    .limit(1)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, message: 'Failed to check client' })
  }

  return {
    clientExists: Boolean(client),
    verified,
    ...(client?.first_name ? { firstName: client.first_name } : {})
  }
})
