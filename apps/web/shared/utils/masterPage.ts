/**
 * Pure helpers for the master's public page: working hours summary, visits
 * counter, contact links and vacation. Shared by the API and the page.
 */

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

/** Consecutive weekdays with the same hours, e.g. Mon–Sat 10:00–20:00. */
export interface WorkingHoursRange {
  from: IsoWeekday
  to: IsoWeekday
  /** 'HH:MM' in the master's time zone */
  start: string
  end: string
}

interface ScheduleDayLike {
  start: string | null
  end: string | null
  enabled: boolean
}

const WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

/** The master's weekly schedule as ranges of days with equal hours. Breaks are ignored. */
export function summarizeWorkingHours(
  days: Partial<Record<string, ScheduleDayLike>> | null | undefined
): WorkingHoursRange[] {
  const ranges: WorkingHoursRange[] = []

  WEEK.forEach((name, i) => {
    const day = days?.[name]
    if (!day?.enabled || !day.start || !day.end) return

    const weekday = (i + 1) as IsoWeekday
    const start = day.start.slice(0, 5)
    const end = day.end.slice(0, 5)
    const last = ranges.at(-1)

    if (last && last.to === weekday - 1 && last.start === start && last.end === end) {
      last.to = weekday
    } else {
      ranges.push({ from: weekday, to: weekday, start, end })
    }
  })

  return ranges
}

/** Working days only, consecutive days merged whatever their hours: Mon–Fri, Sun. */
export function mergeWorkingDays(
  ranges: WorkingHoursRange[]
): Pick<WorkingHoursRange, 'from' | 'to'>[] {
  const days: Pick<WorkingHoursRange, 'from' | 'to'>[] = []

  for (const { from, to } of ranges) {
    const last = days.at(-1)
    if (last && last.to === from - 1) last.to = to
    else days.push({ from, to })
  }

  return days
}

/** Visits shown on the page: exact below 100, then rounded down to hundreds with "+". */
export function roundVisits(count: number): { value: number; plus: boolean } {
  if (count < 100) return { value: count, plus: false }
  return { value: Math.floor(count / 100) * 100, plus: true }
}

/** wa.me link for a WhatsApp number in any format, with an optional prefilled message. */
export function whatsappLink(number: string, text?: string): string | null {
  const digits = number.replace(/\D/g, '')
  if (digits.length < 7) return null
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

/** Telegram username or link → t.me link. */
export function telegramLink(value: string): string | null {
  const handle = value
    .trim()
    .replace(/^https?:\/\/(www\.)?t(elegram)?\.me\//i, '')
    .replace(/^@/, '')
    .split(/[/?#]/)[0]
  return handle ? `https://t.me/${handle}` : null
}

/** Instagram username or link → instagram.com link. */
export function instagramLink(value: string): string | null {
  const handle = value
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .split(/[/?#]/)[0]
  return handle ? `https://instagram.com/${handle}` : null
}

/** The vacation end date (YYYY-MM-DD) when `today` falls inside the vacation, else null. */
export function activeVacationUntil(
  vacation: { vacation_from: string | null; vacation_until: string | null },
  today: string
): string | null {
  const { vacation_from: from, vacation_until: until } = vacation
  if (!from || !until) return null
  return from <= today && today <= until ? until : null
}

/** Whether a day (YYYY-MM-DD) is inside the master's vacation. */
export function isVacationDay(
  vacation: { vacation_from: string | null; vacation_until: string | null },
  date: string
): boolean {
  return activeVacationUntil(vacation, date) !== null
}

/** Whole days from `today` to `date`, both YYYY-MM-DD. */
export function daysBetween(today: string, date: string): number {
  return Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000
  )
}

/** Today's date (YYYY-MM-DD) in a time zone. */
export function todayIn(timezone: string, now = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now)
}
