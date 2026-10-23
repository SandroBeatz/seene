import type { MaybeRefOrGetter } from 'vue'
import type { MasterSettings } from '#shared/types/master'
import type { IsoWeekday, WorkingHoursRange } from '#shared/utils/masterPage'

/**
 * Text formatting for the master's public page, in the page language. Times are
 * shown in the master's time zone (the client may be elsewhere). Uses the page's
 * own keys (`locales/pages/username`), so it only works on `/[username]`.
 */
export function useMasterPageFormat(
  settings: MaybeRefOrGetter<Pick<MasterSettings, 'time_format'> | undefined>
) {
  const { $ts, getLocale } = useI18n()

  const hour12 = computed(() => toValue(settings)?.time_format === 12)

  /** `${base}.one|few|many|other` picked by the locale's plural rules. */
  function plural(base: string, count: number, params: Record<string, unknown> = {}): string {
    const category = new Intl.PluralRules(getLocale()).select(count)
    const key = ['one', 'few', 'many'].includes(category) ? category : 'other'
    return $ts(`${base}.${key}`, { count, ...params })
  }

  function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return [
      h ? $ts('master.duration.hours', { count: h }) : '',
      m || !h ? $ts('master.duration.minutes', { count: m }) : ''
    ]
      .filter(Boolean)
      .join(' ')
  }

  function weekdayShort(day: IsoWeekday): string {
    // 2024-01-01 is a Monday, so ISO weekday N is January N.
    const name = new Intl.DateTimeFormat(getLocale(), { weekday: 'short', timeZone: 'UTC' }).format(
      Date.UTC(2024, 0, day)
    )
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/\.$/, '')
  }

  function formatDays(range: Pick<WorkingHoursRange, 'from' | 'to'>): string {
    return range.from === range.to
      ? weekdayShort(range.from)
      : `${weekdayShort(range.from)}–${weekdayShort(range.to)}`
  }

  /** 'HH:MM' wall-clock time in the page's 12/24h format. */
  function formatClock(hhmm: string): string {
    const [h = 0, m = 0] = hhmm.split(':').map(Number)
    return new Intl.DateTimeFormat(getLocale(), {
      hour: '2-digit',
      minute: '2-digit',
      hour12: hour12.value,
      timeZone: 'UTC'
    }).format(Date.UTC(2024, 0, 1, h, m))
  }

  function formatHours(range: Pick<WorkingHoursRange, 'start' | 'end'>): string {
    return `${formatClock(range.start)}–${formatClock(range.end)}`
  }

  /** "5 November" for a YYYY-MM-DD date. */
  function formatDayMonth(date: string): string {
    return new Intl.DateTimeFormat(getLocale(), {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC'
    }).format(Date.parse(`${date}T00:00:00Z`))
  }

  /** "today, 11:30" / "tomorrow, 11:30" / "Fri 31 Oct, 11:30", in the master's zone. */
  function formatNearest(startAt: string, timezone: string): string {
    const at = Date.parse(startAt)
    const offset = daysBetween(todayIn(timezone), todayIn(timezone, at))
    const time = new Intl.DateTimeFormat(getLocale(), {
      hour: '2-digit',
      minute: '2-digit',
      hour12: hour12.value,
      timeZone: timezone
    }).format(at)

    const day =
      offset <= 1
        ? new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' }).format(offset, 'day')
        : new Intl.DateTimeFormat(getLocale(), {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            timeZone: timezone
          }).format(at)

    return `${day}, ${time}`
  }

  return {
    plural,
    formatDuration,
    formatDays,
    formatHours,
    formatDayMonth,
    formatNearest
  }
}
