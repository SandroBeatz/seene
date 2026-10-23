/**
 * Lookup used by the booking confirm step. It never says whether a phone is a
 * client of the master: without this device's token every number gets the same
 * answer ("a code is needed"). Only a device trusted for this phone and master
 * is recognised, and only then is the client's name returned.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const phone = normalizePhone(query.phone)
  const supabase = useServiceSupabase()
  const masterUserId = await getMasterUserId(supabase, query.username)

  const devicePhone = await readDevicePhone(event, supabase, masterUserId)

  if (devicePhone !== phone) {
    return { recognized: false }
  }

  const { data: client, error } = await supabase
    .from('client')
    .select('first_name')
    .eq('user_id', masterUserId)
    .eq('phone', phone)
    .limit(1)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, message: 'Failed to check client' })
  }

  return {
    recognized: true,
    ...(client?.first_name ? { firstName: client.first_name } : {})
  }
})
