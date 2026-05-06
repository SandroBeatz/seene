export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const phone = normalizePhone(query.phone)
  const username = typeof query.username === 'string' ? query.username.trim() : null
  const supabase = useServiceSupabase()

  if (!username) {
    return { clientExists: false }
  }

  const { data: profile } = await supabase
    .from('master_profile')
    .select('user_id')
    .eq('username', username)
    .single()

  if (!profile) {
    return { clientExists: false }
  }

  const { data: clients, error } = await supabase
    .from('client')
    .select('first_name, phone')
    .eq('user_id', profile.user_id)

  if (error) {
    throw createError({ statusCode: 500, message: 'Failed to check client' })
  }

  const normalizedInput = phone.replace(/\D/g, '')
  const match = (clients ?? []).find((c) => c.phone.replace(/\D/g, '') === normalizedInput)

  return {
    clientExists: Boolean(match),
    ...(match?.first_name ? { firstName: match.first_name } : {})
  }
})
