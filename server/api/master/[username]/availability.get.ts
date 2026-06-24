import {
  DATE_RE,
  type AppointmentRow,
  type TimeBlockRow,
  addDays,
  getProfileSchedule,
  getProfileTimezone,
  getScheduleDay,
  hasAnyFreeSlot,
  isValidDate,
  parseServiceIdsQuery,
  zonedTimeToUtc
} from '../../../utils/slots'

const MAX_RANGE_DAYS = 60

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
      .select('calendar_slot_step_minutes, booking_buffer_minutes, booking_min_notice_minutes')
      .eq('user_id', profile.user_id)
      .maybeSingle()
  ])

  if (servicesError) {
    throw createError({ statusCode: 500, message: 'Failed to load services' })
  }

  if (!services || services.length !== serviceIds.length) {
    throw createError({ statusCode: 400, message: 'One or more services are unavailable' })
  }

  const slotStepMinutes = settingsRow?.calendar_slot_step_minutes ?? 15
  const bufferMinutes = settingsRow?.booking_buffer_minutes ?? 0
  const minNoticeMinutes = settingsRow?.booking_min_notice_minutes ?? 0

  const serviceDuration = services.reduce((total, service) => total + service.duration, 0)
  const schedule = getProfileSchedule(profile.schedule)
  const timezone = getProfileTimezone(profile.schedule)

  if (!schedule) {
    return dates.map((date) => ({ date, available: false }))
  }

  const rangeStart = zonedTimeToUtc(from, '00:00:00', timezone)
  const rangeEnd = zonedTimeToUtc(addDays(to, 1), '00:00:00', timezone)

  const [
    { data: appointments, error: appointmentsError },
    { data: timeBlocks, error: timeBlocksError }
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select('start_at, duration')
      .eq('user_id', profile.user_id)
      .neq('status', 'cancelled')
      .lt('start_at', rangeEnd.toISOString())
      .gte('start_at', rangeStart.toISOString()),
    supabase
      .from('time_block')
      .select('start_at, end_at, all_day')
      .eq('user_id', profile.user_id)
      .lt('start_at', rangeEnd.toISOString())
      .gt('end_at', rangeStart.toISOString())
  ])

  if (appointmentsError) {
    throw createError({ statusCode: 500, message: 'Failed to load appointments' })
  }

  if (timeBlocksError) {
    throw createError({ statusCode: 500, message: 'Failed to load time blocks' })
  }

  return dates.map((date) => {
    const scheduleDay = getScheduleDay(schedule, date)
    if (!scheduleDay?.enabled) return { date, available: false }

    const dayStart = zonedTimeToUtc(date, '00:00:00', timezone)
    const dayEnd = zonedTimeToUtc(addDays(date, 1), '00:00:00', timezone)

    const dayAppointments = (appointments ?? []).filter((a) => {
      const t = new Date(a.start_at).getTime()
      return t >= dayStart.getTime() && t < dayEnd.getTime()
    })

    const dayBlocks = (timeBlocks ?? []).filter(
      (b) =>
        new Date(b.start_at).getTime() < dayEnd.getTime() &&
        new Date(b.end_at).getTime() > dayStart.getTime()
    )

    const available = hasAnyFreeSlot({
      date,
      scheduleDay,
      appointments: dayAppointments as AppointmentRow[],
      timeBlocks: dayBlocks as TimeBlockRow[],
      serviceDuration,
      timezone,
      slotStepMinutes,
      bufferMinutes,
      minNoticeMinutes
    })

    return { date, available }
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
