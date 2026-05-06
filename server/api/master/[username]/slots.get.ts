import {
  DATE_RE,
  type AppointmentRow,
  type Schedule,
  type TimeBlockRow,
  addDays,
  buildFreeSlots,
  getProfileSchedule,
  getProfileTimezone,
  hasAnyFreeSlot,
  isValidDate,
  parseServiceIdsQuery,
  getScheduleDay,
  zonedTimeToUtc
} from '../../../utils/slots'

const NEXT_AVAILABLE_DAYS = 30
const MAX_RANGE_DAYS = 7

export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username')
  const query = getQuery(event)
  const { from } = parseFromToQuery(query.from, query.to)
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

  const { data: services, error: servicesError } = await supabase
    .from('service')
    .select('id, duration')
    .eq('user_id', profile.user_id)
    .eq('is_active', true)
    .in('id', serviceIds)

  if (servicesError) {
    throw createError({ statusCode: 500, message: 'Failed to load services' })
  }

  if (!services || services.length !== serviceIds.length) {
    throw createError({ statusCode: 400, message: 'One or more services are unavailable' })
  }

  const serviceDuration = services.reduce((total, service) => total + service.duration, 0)
  const schedule = getProfileSchedule(profile.schedule)
  const timezone = getProfileTimezone(profile.schedule)

  if (!schedule) {
    return { slots: [], nextAvailableDate: null }
  }

  const slots = await getSlotsForDate({
    supabase,
    masterId: profile.id,
    userId: profile.user_id,
    date: from,
    schedule,
    serviceDuration,
    timezone
  })

  const nextAvailableDate =
    slots.length > 0
      ? null
      : await findNextAvailableDate({
          supabase,
          masterId: profile.id,
          userId: profile.user_id,
          fromDate: from,
          schedule,
          serviceDuration,
          timezone
        })

  return { slots, nextAvailableDate }
})

function parseDateParam(value: unknown, name: string): string {
  if (typeof value !== 'string' || !DATE_RE.test(value) || !isValidDate(value)) {
    throw createError({ statusCode: 400, message: `Query param ${name} must be YYYY-MM-DD` })
  }

  return value
}

function parseFromToQuery(fromValue: unknown, toValue: unknown) {
  const from = parseDateParam(fromValue, 'from')
  const to = parseDateParam(toValue, 'to')

  if (from > to) {
    throw createError({ statusCode: 400, message: 'from must be <= to' })
  }

  const dayDiff =
    (new Date(`${to}T00:00:00.000Z`).getTime() - new Date(`${from}T00:00:00.000Z`).getTime()) /
    (24 * 60 * 60 * 1000)

  if (dayDiff >= MAX_RANGE_DAYS) {
    throw createError({ statusCode: 400, message: `Range must not exceed ${MAX_RANGE_DAYS} days` })
  }

  return { from, to }
}

async function getSlotsForDate({
  supabase,
  masterId,
  userId,
  date,
  schedule,
  serviceDuration,
  timezone
}: {
  supabase: ReturnType<typeof useServiceSupabase>
  masterId: string
  userId: string
  date: string
  schedule: Schedule
  serviceDuration: number
  timezone: string
}) {
  const scheduleDay = getScheduleDay(schedule, date)
  if (!scheduleDay?.enabled) return []

  const dayStart = zonedTimeToUtc(date, '00:00:00', timezone)
  const dayEnd = zonedTimeToUtc(addDays(date, 1), '00:00:00', timezone)

  const [
    { data: appointments, error: appointmentsError },
    { data: timeBlocks, error: timeBlocksError },
    { data: bookings }
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select('start_at, duration')
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .lt('start_at', dayEnd.toISOString())
      .gte('start_at', dayStart.toISOString()),
    supabase
      .from('time_block')
      .select('start_at, end_at, all_day')
      .eq('user_id', userId)
      .lt('start_at', dayEnd.toISOString())
      .gt('end_at', dayStart.toISOString()),
    supabase
      .from('bookings')
      .select('starts_at, ends_at')
      .eq('master_id', masterId)
      .neq('status', 'cancelled')
      .lt('starts_at', dayEnd.toISOString())
      .gt('ends_at', dayStart.toISOString())
  ])

  if (appointmentsError) {
    throw createError({ statusCode: 500, message: 'Failed to load appointments' })
  }

  if (timeBlocksError) {
    throw createError({ statusCode: 500, message: 'Failed to load time blocks' })
  }

  const bookingRows: AppointmentRow[] = (bookings ?? []).map((b) => ({
    start_at: b.starts_at,
    duration: Math.round((new Date(b.ends_at).getTime() - new Date(b.starts_at).getTime()) / 60000)
  }))

  return buildFreeSlots({
    date,
    scheduleDay,
    appointments: [...(appointments ?? []), ...bookingRows] as AppointmentRow[],
    timeBlocks: (timeBlocks ?? []) as TimeBlockRow[],
    serviceDuration,
    timezone
  })
}

async function findNextAvailableDate({
  supabase,
  masterId,
  userId,
  fromDate,
  schedule,
  serviceDuration,
  timezone
}: {
  supabase: ReturnType<typeof useServiceSupabase>
  masterId: string
  userId: string
  fromDate: string
  schedule: Schedule
  serviceDuration: number
  timezone: string
}) {
  const dates = Array.from({ length: NEXT_AVAILABLE_DAYS }, (_, i) => addDays(fromDate, i + 1))
  const rangeStart = zonedTimeToUtc(dates[0]!, '00:00:00', timezone)
  const rangeEnd = zonedTimeToUtc(addDays(dates[dates.length - 1]!, 1), '00:00:00', timezone)

  const [{ data: appointments }, { data: timeBlocks }, { data: bookings }] = await Promise.all([
    supabase
      .from('appointments')
      .select('start_at, duration')
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .lt('start_at', rangeEnd.toISOString())
      .gte('start_at', rangeStart.toISOString()),
    supabase
      .from('time_block')
      .select('start_at, end_at, all_day')
      .eq('user_id', userId)
      .lt('start_at', rangeEnd.toISOString())
      .gt('end_at', rangeStart.toISOString()),
    supabase
      .from('bookings')
      .select('starts_at, ends_at')
      .eq('master_id', masterId)
      .neq('status', 'cancelled')
      .lt('starts_at', rangeEnd.toISOString())
      .gt('ends_at', rangeStart.toISOString())
  ])

  const bookingRows: AppointmentRow[] = (bookings ?? []).map((b) => ({
    start_at: b.starts_at,
    duration: Math.round((new Date(b.ends_at).getTime() - new Date(b.starts_at).getTime()) / 60000)
  }))

  for (const date of dates) {
    const scheduleDay = getScheduleDay(schedule, date)
    if (!scheduleDay?.enabled) continue

    const dayStart = zonedTimeToUtc(date, '00:00:00', timezone)
    const dayEnd = zonedTimeToUtc(addDays(date, 1), '00:00:00', timezone)

    const dayAppointments = [
      ...(appointments ?? []).filter((a) => {
        const t = new Date(a.start_at).getTime()
        return t >= dayStart.getTime() && t < dayEnd.getTime()
      }),
      ...bookingRows.filter((b) => {
        const t = new Date(b.start_at).getTime()
        return t >= dayStart.getTime() && t < dayEnd.getTime()
      })
    ]

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
      timezone
    })

    if (available) return date
  }

  return null
}
