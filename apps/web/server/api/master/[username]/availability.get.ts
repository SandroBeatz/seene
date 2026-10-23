import {
  DATE_RE,
  type AppointmentRow,
  type TimeBlockRow,
  addDays,
  buildFreeSlots,
  getProfileSchedule,
  getProfileTimezone,
  getScheduleDay,
  isValidDate,
  parseServiceIdsQuery,
  zonedTimeToUtc
} from '../../../utils/slots'

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

  const schedule = getProfileSchedule(profile.schedule)
  const timezone = getProfileTimezone(profile.schedule)
  const rangeStart = zonedTimeToUtc(from, '00:00:00', timezone).toISOString()
  const rangeEnd = zonedTimeToUtc(addDays(to, 1), '00:00:00', timezone).toISOString()

  // Everything below depends only on the profile, so it runs in one round trip.
  const [
    { data: services, error: servicesError },
    { data: settingsRow },
    { data: appointments, error: appointmentsError },
    { data: timeBlocks, error: timeBlocksError },
    { data: bookings, error: bookingsError }
  ] = await Promise.all([
    supabase
      .from('service')
      .select('id, duration')
      .eq('user_id', profile.user_id)
      .eq('is_active', true)
      .in('id', serviceIds),
    supabase
      .from('master_settings')
      .select(
        'online_booking_enabled, calendar_slot_step_minutes, booking_buffer_minutes, booking_min_notice_minutes'
      )
      .eq('user_id', profile.user_id)
      .maybeSingle(),
    supabase
      .from('appointments')
      .select('start_at, duration')
      .eq('user_id', profile.user_id)
      .neq('status', 'cancelled')
      .lt('start_at', rangeEnd)
      .gte('start_at', rangeStart),
    supabase
      .from('time_block')
      .select('start_at, end_at, all_day')
      .eq('user_id', profile.user_id)
      .lt('start_at', rangeEnd)
      .gt('end_at', rangeStart),
    supabase
      .from('bookings')
      .select('starts_at, ends_at')
      .eq('master_id', profile.id)
      .neq('status', 'cancelled')
      .lt('starts_at', rangeEnd)
      .gt('ends_at', rangeStart)
  ])

  if (!settingsRow || !settingsRow.online_booking_enabled) {
    throw createError({ statusCode: 403, message: 'Online booking is disabled' })
  }

  if (servicesError || appointmentsError || timeBlocksError || bookingsError) {
    throw createError({ statusCode: 500, message: 'Failed to load availability' })
  }

  if (!services || services.length !== serviceIds.length) {
    throw createError({ statusCode: 400, message: 'One or more services are unavailable' })
  }

  if (!schedule) {
    return dates.map((date) => ({ date, slots: [] as string[] }))
  }

  const serviceDuration = services.reduce((total, service) => total + service.duration, 0)
  const slotParams = {
    slotStepMinutes: settingsRow.calendar_slot_step_minutes ?? 15,
    bufferMinutes: settingsRow.booking_buffer_minutes ?? 0,
    minNoticeMinutes: settingsRow.booking_min_notice_minutes ?? 0,
    nowMs: Date.now()
  }

  const busyRows: AppointmentRow[] = [
    ...((appointments ?? []) as AppointmentRow[]),
    ...(bookings ?? []).map((b) => ({
      start_at: b.starts_at,
      duration: Math.round(
        (new Date(b.ends_at).getTime() - new Date(b.starts_at).getTime()) / 60_000
      )
    }))
  ]

  return dates.map((date) => {
    const scheduleDay = getScheduleDay(schedule, date)
    if (!scheduleDay?.enabled) return { date, slots: [] as string[] }

    const dayStart = zonedTimeToUtc(date, '00:00:00', timezone).getTime()
    const dayEnd = zonedTimeToUtc(addDays(date, 1), '00:00:00', timezone).getTime()

    const dayAppointments = busyRows.filter((a) => {
      const t = new Date(a.start_at).getTime()
      return t >= dayStart && t < dayEnd
    })

    const dayBlocks = ((timeBlocks ?? []) as TimeBlockRow[]).filter(
      (b) => new Date(b.start_at).getTime() < dayEnd && new Date(b.end_at).getTime() > dayStart
    )

    const slots = buildFreeSlots({
      date,
      scheduleDay,
      appointments: dayAppointments,
      timeBlocks: dayBlocks,
      serviceDuration,
      timezone,
      ...slotParams
    })

    return { date, slots }
  })
})

function parseDateParam(value: unknown, name: string): string {
  if (typeof value !== 'string' || !DATE_RE.test(value) || !isValidDate(value)) {
    throw createError({ statusCode: 400, message: `Query param ${name} must be YYYY-MM-DD` })
  }

  return value
}

function buildDateRange(from: string, to: string): string[] {
  const dates: string[] = []
  let current = from

  while (current <= to) {
    dates.push(current)
    current = addDays(current, 1)
  }

  return dates
}
