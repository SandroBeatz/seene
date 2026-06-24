export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const MINUTE_MS = 60 * 1000

const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
] as const

type ScheduleBreak = { start: string; end: string }

export type ScheduleDay = {
  start: string | null
  end: string | null
  breaks: ScheduleBreak[]
  enabled: boolean
}

export type Schedule = {
  timezone: string
  days: Record<string, ScheduleDay>
}

export type AppointmentRow = {
  start_at: string
  duration: number
}

export type TimeBlockRow = {
  start_at: string
  end_at: string
  all_day: boolean
}

// --- Date utils ---

export function isValidDate(date: string) {
  const parsed = new Date(`${date}T00:00:00.000Z`)

  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
}

export function addDays(date: string, days: number) {
  const parsed = new Date(`${date}T00:00:00.000Z`)
  parsed.setUTCDate(parsed.getUTCDate() + days)

  return parsed.toISOString().slice(0, 10)
}

export function getDayOfWeek(date: string) {
  return new Date(`${date}T00:00:00.000Z`).getUTCDay()
}

export function zonedTimeToUtc(date: string, time: string, timezone: string) {
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

export function utcMsToLocalDate(utcMs: number, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(utcMs)
}

// --- Schedule utils ---

export function getProfileTimezone(schedule: unknown) {
  const parsed = parseSchedule(schedule)

  return parsed?.timezone ?? 'UTC'
}

export function getProfileSchedule(schedule: unknown): Schedule | null {
  return parseSchedule(schedule)
}

export function getScheduleDay(schedule: Schedule, date: string): ScheduleDay | null {
  const dayName = DAY_NAMES[getDayOfWeek(date) as 0 | 1 | 2 | 3 | 4 | 5 | 6]

  return dayName ? (schedule.days[dayName] ?? null) : null
}

function parseSchedule(schedule: unknown): Schedule | null {
  if (
    !schedule ||
    typeof schedule !== 'object' ||
    !('timezone' in schedule) ||
    !('days' in schedule) ||
    typeof (schedule as Schedule).days !== 'object'
  ) {
    return null
  }

  return schedule as Schedule
}

// --- Query param utils ---

export function parseServiceIdsQuery(value: unknown) {
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

// --- Slot computation ---

type Interval = { start: number; end: number }

function getWorkingIntervals(date: string, day: ScheduleDay, timezone: string): Interval[] {
  if (!day.enabled || !day.start || !day.end) return []

  const wStart = zonedTimeToUtc(date, day.start, timezone).getTime()
  const wEnd = zonedTimeToUtc(date, day.end, timezone).getTime()

  const breaks = day.breaks.map((b) => ({
    start: zonedTimeToUtc(date, b.start, timezone).getTime(),
    end: zonedTimeToUtc(date, b.end, timezone).getTime()
  }))

  return subtractIntervals({ start: wStart, end: wEnd }, breaks)
}

function subtractIntervals(interval: Interval, subtracts: Interval[]): Interval[] {
  let segments: Interval[] = [interval]

  for (const sub of subtracts) {
    segments = segments.flatMap((seg) => {
      if (sub.start >= seg.end || sub.end <= seg.start) return [seg]
      const parts: Interval[] = []
      if (sub.start > seg.start) parts.push({ start: seg.start, end: sub.start })
      if (sub.end < seg.end) parts.push({ start: sub.end, end: seg.end })
      return parts
    })
  }

  return segments
}

function getBusyIntervals(
  appointments: AppointmentRow[],
  timeBlocks: TimeBlockRow[],
  bufferMinutes: number
): Interval[] {
  const busy: Interval[] = []

  for (const apt of appointments) {
    const start = new Date(apt.start_at).getTime()
    busy.push({ start, end: start + (apt.duration + bufferMinutes) * MINUTE_MS })
  }

  for (const block of timeBlocks) {
    busy.push({
      start: new Date(block.start_at).getTime(),
      end: new Date(block.end_at).getTime()
    })
  }

  return busy
}

export function buildFreeSlots({
  date,
  scheduleDay,
  appointments,
  timeBlocks,
  serviceDuration,
  timezone,
  slotStepMinutes = 15,
  bufferMinutes = 0,
  minNoticeMinutes = 0,
  nowMs = Date.now()
}: {
  date: string
  scheduleDay: ScheduleDay
  appointments: AppointmentRow[]
  timeBlocks: TimeBlockRow[]
  serviceDuration: number
  timezone: string
  slotStepMinutes?: number
  bufferMinutes?: number
  minNoticeMinutes?: number
  nowMs?: number
}): string[] {
  const workingIntervals = getWorkingIntervals(date, scheduleDay, timezone)
  if (!workingIntervals.length) return []

  const busyIntervals = getBusyIntervals(appointments, timeBlocks, bufferMinutes)
  const duration = serviceDuration * MINUTE_MS
  const step = slotStepMinutes * MINUTE_MS
  const minStartMs = nowMs + minNoticeMinutes * MINUTE_MS
  const slots = new Set<string>()

  for (const interval of workingIntervals) {
    for (let t = interval.start; t + duration <= interval.end; t += step) {
      if (t < minStartMs) continue
      const end = t + duration
      const overlaps = busyIntervals.some((b) => t < b.end && end > b.start)
      if (!overlaps) slots.add(new Date(t).toISOString())
    }
  }

  return [...slots].sort()
}

export function hasAnyFreeSlot({
  date,
  scheduleDay,
  appointments,
  timeBlocks,
  serviceDuration,
  timezone,
  slotStepMinutes = 15,
  bufferMinutes = 0,
  minNoticeMinutes = 0,
  nowMs = Date.now()
}: {
  date: string
  scheduleDay: ScheduleDay
  appointments: AppointmentRow[]
  timeBlocks: TimeBlockRow[]
  serviceDuration: number
  timezone: string
  slotStepMinutes?: number
  bufferMinutes?: number
  minNoticeMinutes?: number
  nowMs?: number
}): boolean {
  const workingIntervals = getWorkingIntervals(date, scheduleDay, timezone)
  if (!workingIntervals.length) return false

  const busyIntervals = getBusyIntervals(appointments, timeBlocks, bufferMinutes)
  const duration = serviceDuration * MINUTE_MS
  const step = slotStepMinutes * MINUTE_MS
  const minStartMs = nowMs + minNoticeMinutes * MINUTE_MS

  for (const interval of workingIntervals) {
    for (let t = interval.start; t + duration <= interval.end; t += step) {
      if (t < minStartMs) continue
      const end = t + duration
      const overlaps = busyIntervals.some((b) => t < b.end && end > b.start)
      if (!overlaps) return true
    }
  }

  return false
}
