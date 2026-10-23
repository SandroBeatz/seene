import type { MasterPaymentType, MasterSettings, PaymentTypeKind } from '#shared/types/master'

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
  calendar_slot_step_minutes: 15
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
      row.calendar_slot_step_minutes ?? DEFAULT_SETTINGS.calendar_slot_step_minutes
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
      'id, user_id, first_name, last_name, username, specializations, city, address, house_number, zip_code, country, works_at_place, can_travel, avatar_url, bio, whatsapp, telegram, instagram, tiktok, contact_email'
    )
    .eq('username', username)
    .single()

  if (profileError || !profile) {
    throw createError({ statusCode: 404, message: 'Master not found' })
  }

  // master_settings has no public read policy (owner-only RLS), so it must be
  // read with the service-role client. Profile/services are public-readable.
  const serviceSupabase = useServiceSupabase()

  const [{ data: categories }, { data: services }, { data: settingsRow }, { data: paymentRows }] =
    await Promise.all([
      supabase
        .from('service_category')
        .select('id, name, sort_order')
        .eq('user_id', profile.user_id)
        .order('sort_order'),
      supabase
        .from('service')
        .select('id, category_id, name, description, duration, price, color, sort_order')
        .eq('user_id', profile.user_id)
        .eq('is_active', true)
        .order('sort_order'),
      serviceSupabase
        .from('master_settings')
        .select(
          'language, currency, time_format, date_format, online_booking_enabled, booking_default_status, booking_buffer_minutes, booking_min_notice_minutes, calendar_slot_step_minutes'
        )
        .eq('user_id', profile.user_id)
        .maybeSingle(),
      // payment_type is owner-only (RLS), so it needs the service-role client.
      serviceSupabase
        .from('payment_type')
        .select('id, kind, name, color, is_active, sort_order')
        .eq('user_id', profile.user_id)
        .eq('is_active', true)
        .order('sort_order')
    ])

  const paymentTypes: MasterPaymentType[] = (paymentRows ?? []).map((row) => ({
    id: row.id,
    kind: PAYMENT_KINDS.has(row.kind as PaymentTypeKind) ? (row.kind as PaymentTypeKind) : 'custom',
    name: row.name,
    color: row.color
  }))

  return {
    profile,
    settings: resolveSettings(settingsRow),
    categories: categories ?? [],
    services: services ?? [],
    payment_types: paymentTypes
  }
})
