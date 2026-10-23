import { DATE_RE, isValidDate, parseServiceIdsQuery } from '../../../utils/slots'

const MAX_RANGE_DAYS = 60

/**
 * Free slots for every day in [from, to], computed in one pass so the booking
 * calendar can mark free/busy days and switch days without another request.
 */
export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username')
  const query = getQuery(event)
  const from = parseDateParam(query.from, 'from')
  const to = parseDateParam(query.to, 'to')
  const serviceIds = parseServiceIdsQuery(query.service_ids)
  const supabase = useServiceSupabase()

  if (!username) {
    throw createError({ statusCode: 400, message: 'Username is required' })
  }

  if (from > to) {
    throw createError({ statusCode: 400, message: 'from must be <= to' })
  }

  const dates = buildDateRange(from, to)

  if (dates.length > MAX_RANGE_DAYS) {
    throw createError({
      statusCode: 400,
      message: `Range must not exceed ${MAX_RANGE_DAYS} days`
    })
  }

  const { data: profile, error: profileError } = await supabase
    .from('master_profile')
    .select('id, user_id, schedule')
    .eq('username', username)
    .single()

  if (profileError || !profile) {
    throw createError({ statusCode: 404, message: 'Master not found' })
  }

  const [{ data: services, error: servicesError }, { data: settingsRow }] = await Promise.all([
    supabase
      .from('service')
      .select('id, duration')
      .eq('user_id', profile.user_id)
      .eq('is_active', true)
      .in('id', serviceIds),
    supabase
      .from('master_settings')
      .select(
        'online_booking_enabled, calendar_slot_step_minutes, booking_buffer_minutes, booking_min_notice_minutes, vacation_from, vacation_until'
      )
      .eq('user_id', profile.user_id)
      .maybeSingle()
  ])

  if (!settingsRow || !settingsRow.online_booking_enabled) {
    throw createError({ statusCode: 403, message: 'Online booking is disabled' })
  }

  if (servicesError) {
    throw createError({ statusCode: 500, message: 'Failed to load availability' })
  }

  if (!services || services.length !== serviceIds.length) {
    throw createError({ statusCode: 400, message: 'One or more services are unavailable' })
  }

  return loadDailySlots({
    supabase,
    profile,
    settings: settingsRow,
    dates,
    durationMinutes: services.reduce((total, service) => total + service.duration, 0)
  })
})

function parseDateParam(value: unknown, name: string): string {
  if (typeof value !== 'string' || !DATE_RE.test(value) || !isValidDate(value)) {
    throw createError({ statusCode: 400, message: `Query param ${name} must be YYYY-MM-DD` })
  }

  return value
}
