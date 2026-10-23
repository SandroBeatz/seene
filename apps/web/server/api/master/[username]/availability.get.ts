import {
  DATE_RE,
  addDays,
  getProfileTimezone,
  isValidDate,
  parseServiceIdsQuery
} from '../../../utils/slots'

const MAX_RANGE_DAYS = 60

/**
 * Free slots for every day in [from, to], computed in one pass so the booking
 * calendar can mark free/busy days and switch days without another request.
 * Without from/to: the master's booking horizon, from today in her time zone.
 * The caller's own slot hold stays free for her.
 */
export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username')
  const query = getQuery(event)
  const serviceIds = parseServiceIdsQuery(query.service_ids)
  const supabase = useServiceSupabase()

  if (!username) {
    throw createError({ statusCode: 400, message: 'Username is required' })
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
      .eq('show_online', true)
      .in('id', serviceIds),
    supabase
      .from('master_settings')
      .select(
        'online_booking_enabled, calendar_slot_step_minutes, booking_buffer_minutes, booking_min_notice_minutes, booking_horizon_days, vacation_from, vacation_until'
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

  const today = todayIn(getProfileTimezone(profile.schedule))
  const from =
    query.from === undefined ? today : parseDateParam(query.from, 'from')
  const to =
    query.to === undefined
      ? addDays(today, settingsRow.booking_horizon_days - 1)
      : parseDateParam(query.to, 'to')

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

  // Depends on the caller's hold cookie: never cache it in a shared cache.
  setResponseHeader(event, 'Cache-Control', 'private, no-store')

  return loadDailySlots({
    supabase,
    profile,
    settings: settingsRow,
    dates,
    durationMinutes: services.reduce((total, service) => total + service.duration, 0),
    holderHash: readHolderHash(event)
  })
})

function parseDateParam(value: unknown, name: string): string {
  if (typeof value !== 'string' || !DATE_RE.test(value) || !isValidDate(value)) {
    throw createError({ statusCode: 400, message: `Query param ${name} must be YYYY-MM-DD` })
  }

  return value
}
