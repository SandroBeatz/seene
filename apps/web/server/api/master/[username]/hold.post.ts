import { UUID_RE, getProfileTimezone, utcMsToLocalDate } from '../../../utils/slots'

const ISO_DATETIME_WITH_ZONE_RE = /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/

/**
 * Holds the chosen slot for SLOT_HOLD_MINUTES while the client fills in her
 * details. One hold per browser per master: a new hold replaces the old one.
 * 409 when the slot is gone, so the page can send her back to pick another.
 */
export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username')
  const body = await readBody<{ service_id?: unknown; starts_at?: unknown }>(event)

  if (!username) {
    throw createError({ statusCode: 400, message: 'Username is required' })
  }

  if (typeof body?.service_id !== 'string' || !UUID_RE.test(body.service_id)) {
    throw createError({ statusCode: 400, message: 'service_id must be a UUID' })
  }

  if (typeof body.starts_at !== 'string' || !ISO_DATETIME_WITH_ZONE_RE.test(body.starts_at)) {
    throw createError({ statusCode: 400, message: 'starts_at is required' })
  }

  const startsAtMs = new Date(body.starts_at).getTime()
  if (Number.isNaN(startsAtMs)) {
    throw createError({ statusCode: 400, message: 'starts_at must be an ISO datetime string' })
  }
  const startsAt = new Date(startsAtMs).toISOString()

  const supabase = useServiceSupabase()

  const { data: profile } = await supabase
    .from('master_profile')
    .select('id, user_id, schedule')
    .eq('username', username)
    .maybeSingle()

  if (!profile) {
    throw createError({ statusCode: 404, message: 'Master not found' })
  }

  const [{ data: settingsRow }, { data: service }] = await Promise.all([
    supabase
      .from('master_settings')
      .select(
        'online_booking_enabled, calendar_slot_step_minutes, booking_buffer_minutes, booking_min_notice_minutes, vacation_from, vacation_until'
      )
      .eq('user_id', profile.user_id)
      .maybeSingle(),
    supabase
      .from('service')
      .select('duration')
      .eq('id', body.service_id)
      .eq('user_id', profile.user_id)
      .eq('is_active', true)
      .eq('show_online', true)
      .maybeSingle()
  ])

  if (!settingsRow?.online_booking_enabled) {
    throw createError({ statusCode: 403, message: 'Online booking is disabled' })
  }

  if (!service) {
    throw createError({ statusCode: 400, message: 'Service is unavailable' })
  }

  const holderHash = ensureHolderHash(event)

  // Schedule, breaks, step and notice: the same rules as the slots she was shown.
  const date = utcMsToLocalDate(startsAtMs, getProfileTimezone(profile.schedule))
  const [day] = await loadDailySlots({
    supabase,
    profile,
    settings: settingsRow,
    dates: [date],
    durationMinutes: service.duration,
    holderHash
  })

  if (!day?.slots.includes(startsAt)) {
    throw createError({ statusCode: 409, message: 'Slot is unavailable' })
  }

  // Concurrent bookings and holds are settled under the master's lock.
  const { data: expiresAt, error } = await supabase.rpc('hold_booking_slot', {
    p_username: username,
    p_holder_hash: holderHash,
    p_starts_at: startsAt,
    p_duration: service.duration,
    p_ttl_minutes: SLOT_HOLD_MINUTES
  })

  if (error) {
    if (error.message.includes('slot_unavailable')) {
      throw createError({ statusCode: 409, message: 'Slot is unavailable' })
    }
    throw createError({ statusCode: 500, message: 'Failed to hold the slot' })
  }

  return { expires_at: new Date(expiresAt).toISOString() }
})
