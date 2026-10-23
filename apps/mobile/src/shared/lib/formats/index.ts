/**
 * Display formatters — time (12/24h), date, price (currency), duration.
 * Pure functions that take explicit options so they're unit-testable; a thin hook
 * layer (added with the master-preferences store) supplies options from settings.
 * See docs/mobile-architecture.md §5.
 */
import { DateTime } from 'luxon';
import { zonedDateTime } from '@/shared/lib/time-zone';

export interface FormatContext {
  zone: string;
  /** master_settings.time_format: 12 or 24. */
  timeFormat: 12 | 24;
  /** master_settings.date_format token, e.g. 'DD/MM/YYYY'. */
  dateFormat: string;
  /** ISO 4217 code, e.g. 'EUR'. */
  currency: string;
  /** BCP-47 locale for number formatting, e.g. 'en'. */
  locale: string;
}

/** UTC ISO → localized clock time. */
export function formatTime(utcIso: string, ctx: Pick<FormatContext, 'zone' | 'timeFormat'>): string {
  const dt = zonedDateTime(utcIso, ctx.zone);
  return dt.toFormat(ctx.timeFormat === 24 ? 'HH:mm' : 'h:mm a');
}

const DATE_TOKEN_MAP: Record<string, string> = {
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd',
  'D MMM YYYY': 'd MMM yyyy',
};

/** UTC ISO → localized date using a master_settings.date_format token. */
export function formatDate(
  utcIso: string,
  ctx: Pick<FormatContext, 'zone' | 'dateFormat' | 'locale'>,
): string {
  const luxonToken = DATE_TOKEN_MAP[ctx.dateFormat] ?? 'dd/MM/yyyy';
  return zonedDateTime(utcIso, ctx.zone).setLocale(ctx.locale).toFormat(luxonToken);
}

/** Amount (major units) → currency string. */
export function formatPrice(
  amount: number,
  ctx: Pick<FormatContext, 'currency' | 'locale'>,
): string {
  try {
    return new Intl.NumberFormat(ctx.locale, {
      style: 'currency',
      currency: ctx.currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${ctx.currency}`;
  }
}

/** Minutes → compact human duration, e.g. 90 → "1h 30m", 45 → "45m". */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Relative day label helper for lists ("Today"/"Tomorrow"/date). */
export function isSameCalendarDay(aUtcIso: string, bUtcIso: string, zone: string): boolean {
  return zonedDateTime(aUtcIso, zone).hasSame(zonedDateTime(bUtcIso, zone), 'day');
}

export { DateTime };
