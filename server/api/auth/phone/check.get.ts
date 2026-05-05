export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const phone = normalizePhone(query.phone)
  const supabase = useServiceSupabase()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('client_name')
    .eq('client_phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, message: 'Failed to check client' })
  }

  const firstName = booking?.client_name?.trim().split(/\s+/)[0] || undefined

  return {
    clientExists: Boolean(booking),
    ...(firstName ? { firstName } : {})
  }
})
