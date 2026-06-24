import type { MaybeRefOrGetter } from 'vue'
import type { MasterSettings } from '#shared/types/master'

type FormatSettings = Partial<Pick<MasterSettings, 'currency' | 'time_format' | 'date_format'>>

// Mirror the API's safe defaults so formatting stays sensible while the master
// data is still loading (settings undefined) or a field is missing.
const FALLBACK = { currency: 'USD', time_format: 24 as 12 | 24, date_format: 'DD.MM.YYYY' }

/** Parse a price that may arrive as a number or a localized string. */
export function priceToNumber(price: number | string): number {
  if (typeof price === 'number') return price
  const parsed = Number.parseFloat(price.replace(/[^\d,.-]/g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

/** Apply a token-based date pattern (DD/MM/YYYY/YY) to a date. */
function applyDateFormat(date: Date, pattern: string): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = String(date.getFullYear())

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
 */
export function useMasterFormat(settings: MaybeRefOrGetter<FormatSettings | undefined>) {
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
    try {
      return new Intl.NumberFormat(getLocale(), {
        style: 'currency',
        currency: resolved.value.currency,
        maximumFractionDigits: 2
      }).format(value)
    } catch {
      // Invalid/unknown currency code — fall back to a plain number.
      return new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 2 }).format(value)
    }
  }

  function formatTime(value: Date | string): string {
    return new Intl.DateTimeFormat(getLocale(), {
      hour: '2-digit',
      minute: '2-digit',
      hour12: resolved.value.time_format === 12
    }).format(toDate(value))
  }

  /** Numeric date following the master's date_format (e.g. 05.06.2026). */
  function formatDate(value: Date | string): string {
    return applyDateFormat(toDate(value), resolved.value.date_format)
  }

  /** Localized weekday + numeric date (e.g. "Monday, 05.06.2026"). */
  function formatWeekdayDate(value: Date | string): string {
    const date = toDate(value)
    const weekday = new Intl.DateTimeFormat(getLocale(), { weekday: 'long' }).format(date)
    return `${weekday}, ${formatDate(date)}`
  }

  /** Weekday + date + time, honoring both date_format and time_format. */
  function formatDateTime(value: Date | string): string {
    const date = toDate(value)
    return `${formatWeekdayDate(date)}, ${formatTime(date)}`
  }

  return { formatPrice, formatTime, formatDate, formatWeekdayDate, formatDateTime }
}
