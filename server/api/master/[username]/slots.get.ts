const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MINUTE_MS = 60 * 1000
const NEXT_AVAILABLE_DAYS = 30

type AvailabilityRow = {
  start_time: string
  end_time: string
  slot_duration: number
}

type BookingRow = {
  starts_at: string
  ends_at: string
}

export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username')
  const query = getQuery(event)
  const date = parseDateQuery(query.date)
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
  const timezone = getProfileTimezone(profile.schedule)

  const slots = await getSlotsForDate({
    supabase,
    masterId: profile.id,
    date,
    serviceDuration,
    timezone
  })

  const nextAvailableDate =
    slots.length > 0
      ? null
      : await findNextAvailableDate({
          supabase,
          masterId: profile.id,
          date,
          serviceDuration,
          timezone
        })

  return {
    slots,
    nextAvailableDate
  }
})

function parseDateQuery(value: unknown) {
  if (typeof value !== 'string' || !DATE_RE.test(value) || !isValidDate(value)) {
    throw createError({ statusCode: 400, message: 'Query param date must be YYYY-MM-DD' })
  }

  return value
}

function parseServiceIdsQuery(value: unknown) {
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: 'Query param service_ids is required' })
  }

  const serviceIds = value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  if (!serviceIds.length || serviceIds.some((id) => !UUID_RE.test(id))) {
    throw createError({
      statusCode: 400,
      message: 'Query param service_ids must be comma-separated UUIDs'
    })
  }

  return [...new Set(serviceIds)]
}

function isValidDate(date: string) {
  const parsed = new Date(`${date}T00:00:00.000Z`)

  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
}

function getProfileTimezone(schedule: unknown) {
  if (
    schedule &&
    typeof schedule === 'object' &&
    'timezone' in schedule &&
    typeof schedule.timezone === 'string' &&
    isSupportedTimezone(schedule.timezone)
  ) {
    return schedule.timezone
  }

  return 'UTC'
}

function isSupportedTimezone(timezone: string) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

async function findNextAvailableDate({
  supabase,
  masterId,
  date,
  serviceDuration,
  timezone
}: {
  supabase: ReturnType<typeof useServiceSupabase>
  masterId: string
  date: string
  serviceDuration: number
  timezone: string
}) {
  for (let offset = 1; offset <= NEXT_AVAILABLE_DAYS; offset += 1) {
    const nextDate = addDays(date, offset)
    const slots = await getSlotsForDate({
      supabase,
      masterId,
      date: nextDate,
      serviceDuration,
      timezone
    })

    if (slots.length > 0) {
      return nextDate
    }
  }

  return null
}

async function getSlotsForDate({
  supabase,
  masterId,
  date,
  serviceDuration,
  timezone
}: {
  supabase: ReturnType<typeof useServiceSupabase>
  masterId: string
  date: string
  serviceDuration: number
  timezone: string
}) {
  const dayOfWeek = getDayOfWeek(date)
  const dayStart = zonedTimeToUtc(date, '00:00:00', timezone)
  const dayEnd = zonedTimeToUtc(addDays(date, 1), '00:00:00', timezone)

  const [{ data: availability, error: availabilityError }, { data: bookings, error: bookingsError }] =
    await Promise.all([
      supabase
        .from('availability')
        .select('start_time, end_time, slot_duration')
        .eq('master_id', masterId)
        .or(`specific_date.eq.${date},day_of_week.eq.${dayOfWeek}`),
      supabase
        .from('bookings')
        .select('starts_at, ends_at')
        .eq('master_id', masterId)
        .neq('status', 'cancelled')
        .lt('starts_at', dayEnd.toISOString())
        .gt('ends_at', dayStart.toISOString())
    ])

  if (availabilityError) {
    throw createError({ statusCode: 500, message: 'Failed to load availability' })
  }

  if (bookingsError) {
    throw createError({ statusCode: 500, message: 'Failed to load bookings' })
  }

  return buildFreeSlots({
    date,
    availability: availability ?? [],
    bookings: bookings ?? [],
    serviceDuration,
    timezone
  })
}

function buildFreeSlots({
  date,
  availability,
  bookings,
  serviceDuration,
  timezone
}: {
  date: string
  availability: AvailabilityRow[]
  bookings: BookingRow[]
  serviceDuration: number
  timezone: string
}) {
  const busyIntervals = bookings.map((booking) => ({
    start: new Date(booking.starts_at).getTime(),
    end: new Date(booking.ends_at).getTime()
  }))
  const slots = new Set<string>()

  for (const row of availability) {
    const startsAt = zonedTimeToUtc(date, row.start_time, timezone)
    const endsAt = zonedTimeToUtc(date, row.end_time, timezone)
    const step = row.slot_duration * MINUTE_MS
    const duration = serviceDuration * MINUTE_MS

    for (
      let slotStart = startsAt.getTime();
      slotStart + duration <= endsAt.getTime();
      slotStart += step
    ) {
      const slotEnd = slotStart + duration
      const overlapsBooking = busyIntervals.some(
        (booking) => slotStart < booking.end && slotEnd > booking.start
      )

      if (!overlapsBooking) {
        slots.add(new Date(slotStart).toISOString())
      }
    }
  }

  return [...slots].sort()
}

function addDays(date: string, days: number) {
  const parsed = new Date(`${date}T00:00:00.000Z`)
  parsed.setUTCDate(parsed.getUTCDate() + days)

  return parsed.toISOString().slice(0, 10)
}

function getDayOfWeek(date: string) {
  return new Date(`${date}T00:00:00.000Z`).getUTCDay()
}

function zonedTimeToUtc(date: string, time: string, timezone: string) {
  const year = Number(date.slice(0, 4))
  const month = Number(date.slice(5, 7))
  const day = Number(date.slice(8, 10))
  const [hour = 0, minute = 0, second = 0] = time.split(':').map(Number)
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  })
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(utcGuess)).map((part) => [part.type, part.value])
  )
  const timezoneTimeAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  )
  const offset = timezoneTimeAsUtc - utcGuess

  return new Date(utcGuess - offset)
}
