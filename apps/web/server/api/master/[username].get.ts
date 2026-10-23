import type {
  MasterPageData,
  MasterPaymentType,
  MasterSettings,
  PaymentTypeKind
} from '#shared/types/master'
import { getProfileSchedule } from '../../utils/slots'

const PAYMENT_KINDS = new Set<PaymentTypeKind>(['cash', 'card', 'custom'])

const DEFAULT_SETTINGS: MasterSettings = {
  language: 'en',
  currency: 'USD',
  time_format: 24,
  date_format: 'DD.MM.YYYY',
  online_booking_enabled: false,
  booking_default_status: 'pending',
  booking_buffer_minutes: 0,
  booking_min_notice_minutes: 0,
  calendar_slot_step_minutes: 15,
  page_theme: DEFAULT_PAGE_THEME,
  page_accent: DEFAULT_PAGE_ACCENT,
  booking_horizon_days: 14,
  cancel_window_hours: 12,
  vacation_from: null,
  vacation_until: null
}

const LANGUAGES = new Set<MasterSettings['language']>(['en', 'fr', 'ru'])

type MasterSettingsRow = {
  language: string | null
  currency: string | null
  time_format: number | null
  date_format: string | null
  online_booking_enabled: boolean | null
  booking_default_status: string | null
  booking_buffer_minutes: number | null
  booking_min_notice_minutes: number | null
  calendar_slot_step_minutes: number | null
  page_theme: string | null
  page_accent: string | null
  booking_horizon_days: number | null
  cancel_window_hours: number | null
  vacation_from: string | null
  vacation_until: string | null
}

/**
 * Resolve a (possibly missing) master_settings row into a fully-defaulted
 * MasterSettings object. The row is lazy — a master who never opened the
 * dashboard Settings has no row at all — so consumers must never see a hole.
 */
function resolveSettings(row: MasterSettingsRow | null): MasterSettings {
  if (!row) return { ...DEFAULT_SETTINGS }

  const language = row.language as MasterSettings['language']

  return {
    language: LANGUAGES.has(language) ? language : DEFAULT_SETTINGS.language,
    currency: row.currency ?? DEFAULT_SETTINGS.currency,
    time_format: row.time_format === 12 ? 12 : 24,
    date_format: row.date_format ?? DEFAULT_SETTINGS.date_format,
    online_booking_enabled: row.online_booking_enabled ?? DEFAULT_SETTINGS.online_booking_enabled,
    booking_default_status: row.booking_default_status === 'confirmed' ? 'confirmed' : 'pending',
    booking_buffer_minutes: row.booking_buffer_minutes ?? DEFAULT_SETTINGS.booking_buffer_minutes,
    booking_min_notice_minutes:
      row.booking_min_notice_minutes ?? DEFAULT_SETTINGS.booking_min_notice_minutes,
    calendar_slot_step_minutes:
      row.calendar_slot_step_minutes ?? DEFAULT_SETTINGS.calendar_slot_step_minutes,
    page_theme: resolvePageTheme(row.page_theme),
    page_accent: row.page_accent ?? DEFAULT_SETTINGS.page_accent,
    booking_horizon_days: row.booking_horizon_days ?? DEFAULT_SETTINGS.booking_horizon_days,
    cancel_window_hours: row.cancel_window_hours ?? DEFAULT_SETTINGS.cancel_window_hours,
    vacation_from: row.vacation_from,
    vacation_until: row.vacation_until
  }
}

export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username')
  const supabase = useSupabase()

  if (!username) {
    throw createError({ statusCode: 400, message: 'Username is required' })
  }

  const { data: profile, error: profileError } = await supabase
    .from('master_profile')
    .select(
      'id, user_id, first_name, last_name, username, specializations, city, address, house_number, zip_code, country, works_at_place, can_travel, avatar_url, bio, whatsapp, telegram, instagram, tiktok, contact_email, cover_url, experience_years, show_visits_count, map_url, is_verified, schedule'
    )
    .eq('username', username)
    .single()

  if (profileError || !profile) {
    throw createError({ statusCode: 404, message: 'Master not found' })
  }

  const { schedule, ...publicProfile } = profile
  const parsedSchedule = getProfileSchedule(schedule)

  // master_settings has no public read policy (owner-only RLS), so it must be
  // read with the service-role client. Profile/services are public-readable.
  const serviceSupabase = useServiceSupabase()

  const [
    { data: categories },
    { data: services },
    { data: settingsRow },
    { data: paymentRows },
    { data: portfolio },
    { count: visitsCount }
  ] = await Promise.all([
    supabase
      .from('service_category')
      .select('id, name, sort_order')
      .eq('user_id', profile.user_id)
      .order('sort_order'),
    supabase
      .from('service')
      .select(
        'id, category_id, name, description, duration, price, color, sort_order, photo_url, price_from, show_online'
      )
      .eq('user_id', profile.user_id)
      .eq('is_active', true)
      .order('sort_order'),
    serviceSupabase
      .from('master_settings')
      .select(
        'language, currency, time_format, date_format, online_booking_enabled, booking_default_status, booking_buffer_minutes, booking_min_notice_minutes, calendar_slot_step_minutes, page_theme, page_accent, booking_horizon_days, cancel_window_hours, vacation_from, vacation_until'
      )
      .eq('user_id', profile.user_id)
      .maybeSingle(),
    // payment_type is owner-only (RLS), so it needs the service-role client.
    serviceSupabase
      .from('payment_type')
      .select('id, kind, name, color, is_active, sort_order')
      .eq('user_id', profile.user_id)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('portfolio_item')
      .select('id, photo_url, service_id, sort_order')
      .eq('user_id', profile.user_id)
      .order('sort_order'),
    // Past visits that happened: shown only when the master turned the counter on.
    profile.show_visits_count
      ? serviceSupabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.user_id)
          .in('status', ['confirmed', 'completed'])
          .lt('start_at', new Date().toISOString())
      : Promise.resolve({ count: null })
  ])

  const paymentTypes: MasterPaymentType[] = (paymentRows ?? []).map((row) => ({
    id: row.id,
    kind: PAYMENT_KINDS.has(row.kind as PaymentTypeKind) ? (row.kind as PaymentTypeKind) : 'custom',
    name: row.name,
    color: row.color
  }))

  return {
    profile: publicProfile,
    settings: resolveSettings(settingsRow),
    categories: categories ?? [],
    services: services ?? [],
    payment_types: paymentTypes,
    portfolio: portfolio ?? [],
    working_hours: summarizeWorkingHours(parsedSchedule?.days),
    timezone: parsedSchedule?.timezone ?? 'UTC',
    visits_count: profile.show_visits_count ? (visitsCount ?? 0) : null
  } satisfies MasterPageData
})
