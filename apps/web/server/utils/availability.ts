import {
  type AppointmentRow,
  type TimeBlockRow,
  addDays,
  buildFreeSlots,
  getProfileSchedule,
  getProfileTimezone,
  getScheduleDay,
  zonedTimeToUtc
} from './slots'

export type DailySlots = { date: string; slots: string[] }

type SlotSettings = {
  calendar_slot_step_minutes: number | null
  booking_buffer_minutes: number | null
  booking_min_notice_minutes: number | null
  vacation_from: string | null
  vacation_until: string | null
}

/**
 * Free slots for every day in [from, to] (YYYY-MM-DD, master's time zone) for a
 * visit of `durationMinutes`. Busy time is appointments, legacy bookings, time
 * blocks and slots held by other clients on the details step (`holderHash` is
 * the caller's own hold, which stays free for her); vacation days have no
 * slots. One round trip for the whole range.
 */
export async function loadDailySlots({
  supabase,
  profile,
  settings,
  dates,
  durationMinutes,
  holderHash = null,
  nowMs = Date.now()
}: {
  supabase: ReturnType<typeof useServiceSupabase>
  profile: { id: string; user_id: string; schedule: unknown }
  settings: SlotSettings
  dates: string[]
  durationMinutes: number
  holderHash?: string | null
  nowMs?: number
}): Promise<DailySlots[]> {
  const schedule = getProfileSchedule(profile.schedule)
  if (!schedule || !dates.length) return dates.map((date) => ({ date, slots: [] }))

  const timezone = getProfileTimezone(profile.schedule)
  const from = dates[0]!
  const to = dates.at(-1)!
  const rangeStart = zonedTimeToUtc(from, '00:00:00', timezone).toISOString()
  const rangeEnd = zonedTimeToUtc(addDays(to, 1), '00:00:00', timezone).toISOString()

  const [
    { data: appointments, error: appointmentsError },
    { data: timeBlocks, error: timeBlocksError },
    { data: bookings, error: bookingsError },
    { data: holds, error: holdsError }
  ] = await Promise.all([
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
      .gt('ends_at', rangeStart),
    supabase
      .from('slot_hold')
      .select('start_at, end_at, holder_hash')
      .eq('master_user_id', profile.user_id)
      .gt('expires_at', new Date(nowMs).toISOString())
      .lt('start_at', rangeEnd)
      .gte('start_at', rangeStart)
  ])

  if (appointmentsError || timeBlocksError || bookingsError || holdsError) {
    throw createError({ statusCode: 500, message: 'Failed to load availability' })
  }

  const slotParams = {
    slotStepMinutes: settings.calendar_slot_step_minutes ?? 15,
    bufferMinutes: settings.booking_buffer_minutes ?? 0,
    minNoticeMinutes: settings.booking_min_notice_minutes ?? 0,
    nowMs
  }

  const busyRows: AppointmentRow[] = [
    ...((appointments ?? []) as AppointmentRow[]),
    ...(bookings ?? []).map((b) => intervalRow(b.starts_at, b.ends_at)),
    ...(holds ?? [])
      .filter((h) => h.holder_hash !== holderHash)
      .map((h) => intervalRow(h.start_at, h.end_at))
  ]

  return dates.map((date) => {
    const scheduleDay = getScheduleDay(schedule, date)
    if (!scheduleDay?.enabled || isVacationDay(settings, date)) return { date, slots: [] }

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
      serviceDuration: durationMinutes,
      timezone,
      ...slotParams
    })

    return { date, slots }
  })
}

function intervalRow(start: string, end: string): AppointmentRow {
  return {
    start_at: start,
    duration: Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000)
  }
}

export function buildDateRange(from: string, to: string): string[] {
  const dates: string[] = []
  let current = from

  while (current <= to) {
    dates.push(current)
    current = addDays(current, 1)
  }

  return dates
}
