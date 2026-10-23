import type { MaybeRefOrGetter } from 'vue'
import type { MasterSettings } from '#shared/types/master'

type FormatSettings = Partial<Pick<MasterSettings, 'currency' | 'time_format' | 'date_format'>>

// Mirror the API's safe defaults so formatting stays sensible while the master
// data is still loading (settings undefined) or a field is missing.
const FALLBACK = {
  currency: DEFAULT_CURRENCY_CODE,
  time_format: 24 as 12 | 24,
  date_format: 'DD.MM.YYYY'
}

// Non-breaking space keeps the amount and symbol on the same line.
const NBSP = ' '

/** Parse a price that may arrive as a number or a localized string. */
export function priceToNumber(price: number | string): number {
  if (typeof price === 'number') return price
  const parsed = Number.parseFloat(price.replace(/[^\d,.-]/g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

/** Apply a token-based date pattern (DD/MM/YYYY/YY) to a date, in `timeZone`. */
function applyDateFormat(date: Date, pattern: string, timeZone?: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  )
  const dd = parts.day ?? ''
  const mm = parts.month ?? ''
  const yyyy = parts.year ?? ''

  return pattern
    .replace(/YYYY/g, yyyy)
    .replace(/YY/g, yyyy.slice(-2))
    .replace(/DD/g, dd)
    .replace(/MM/g, mm)
}

function toDate(value: Date | string): Date {
  return typeof value === 'string' ? new Date(value) : value
}

/**
 * Formatting helpers bound to a master's preferences (currency, 12/24h time,
 * numeric date pattern). The active i18n locale is the master's language (the
 * master-locale override middleware guarantees this on public routes), so
 * Intl-driven parts (currency symbol, weekday name) come out in that language.
 * Dates and times are shown in `timeZone` (the master's) when given, else in
 * the browser's.
 */
export function useMasterFormat(
  settings: MaybeRefOrGetter<FormatSettings | undefined>,
  timeZone?: MaybeRefOrGetter<string | undefined>
) {
  const { getLocale } = useI18n()

  const resolved = computed(() => {
    const s = toValue(settings)
    return {
      currency: s?.currency ?? FALLBACK.currency,
      time_format: s?.time_format ?? FALLBACK.time_format,
      date_format: s?.date_format ?? FALLBACK.date_format
    }
  })

  function formatPrice(price: number | string): string {
    const value = priceToNumber(price)

    // Symbol/position/decimals come from the currency catalogue (locale-independent),
    // not from Intl currency formatting. The locale only drives digit grouping.
    const currency = getCurrency(resolved.value.currency) ?? getCurrency(DEFAULT_CURRENCY_CODE)
    const decimals = currency?.decimals ?? 2

    const amount = new Intl.NumberFormat(getLocale(), {
      style: 'decimal',
      useGrouping: true,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)

    if (!currency) return amount

    return currency.position === 'prefix'
      ? `${currency.symbol}${NBSP}${amount}`
      : `${amount}${NBSP}${currency.symbol}`
  }

  function formatTime(value: Date | string): string {
    return new Intl.DateTimeFormat(getLocale(), {
      timeZone: toValue(timeZone),
      hour: '2-digit',
      minute: '2-digit',
      hour12: resolved.value.time_format === 12
    }).format(toDate(value))
  }

  /** Numeric date following the master's date_format (e.g. 05.06.2026). */
  function formatDate(value: Date | string): string {
    return applyDateFormat(toDate(value), resolved.value.date_format, toValue(timeZone))
  }

  /** Localized weekday + numeric date (e.g. "Monday, 05.06.2026"). */
  function formatWeekdayDate(value: Date | string): string {
    const date = toDate(value)
    const weekday = new Intl.DateTimeFormat(getLocale(), {
      weekday: 'long',
      timeZone: toValue(timeZone)
    }).format(date)
    return `${weekday}, ${formatDate(date)}`
  }

  /** Weekday + date + time, honoring both date_format and time_format. */
  function formatDateTime(value: Date | string): string {
    const date = toDate(value)
    return `${formatWeekdayDate(date)}, ${formatTime(date)}`
  }

  return { formatPrice, formatTime, formatDate, formatWeekdayDate, formatDateTime }
}
