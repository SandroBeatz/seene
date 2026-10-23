import { getProfileTimezone, utcMsToLocalDate } from '../../../utils/slots'

const ISO_DATETIME_WITH_ZONE_RE = /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/

/**
 * Moves the booking behind a personal link to another time. The link is the
 * proof: no phone or code is asked, the client and the services are the old
 * booking's. The new booking is created first and the old one is cancelled in
 * the same transaction (create_appointment_from_booking). Returns the new
 * booking's link token, so the page can open it.
 */
export default defineEventHandler(async (event) => {
  const token = parseBookingLinkToken(getRouterParam(event, 'token'))
  if (!token) {
    throw createError({ statusCode: 404, message: 'Booking not found' })
  }

  const body = await readBody<{ starts_at?: unknown }>(event)
  const startsAt = parseStartsAt(body?.starts_at)
  const supabase = useServiceSupabase()

  const { data: link } = await supabase
    .from('booking_link')
    .select(
      'expires_at, appointment:appointments!inner(user_id, service_ids, status, start_at, client:client!inner(phone))'
    )
    .eq('token_hash', hashBookingLinkToken(token))
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!link) {
    throw createError({ statusCode: 404, message: 'Booking not found' })
  }

  const { user_id: masterUserId, service_ids: serviceIds, client } = link.appointment

  const [{ data: profile }, { data: settings }, { data: services }] = await Promise.all([
    supabase
      .from('master_profile')
      .select('id, user_id, username, first_name, last_name, schedule')
      .eq('user_id', masterUserId)
      .maybeSingle(),
    supabase
      .from('master_settings')
      .select(
        'online_booking_enabled, booking_min_notice_minutes, booking_buffer_minutes, calendar_slot_step_minutes, vacation_from, vacation_until, language, time_format, cancel_window_hours'
      )
      .eq('user_id', masterUserId)
      .maybeSingle(),
    supabase
      .from('service')
      .select('id, duration')
      .eq('user_id', masterUserId)
      .eq('is_active', true)
      .eq('show_online', true)
      .in('id', serviceIds)
  ])

  if (!profile) {
    throw createError({ statusCode: 404, message: 'Booking not found' })
  }
  // Cancelled already, or the cancel window has closed: say so before looking
  // at the time she picked. The RPC checks it again under the lock.
  const state = bookingLinkState({
    status: link.appointment.status,
    startAt: link.appointment.start_at,
    linkExpiresAt: link.expires_at,
    cancelWindowHours: settings?.cancel_window_hours ?? 12
  })
  if (state !== 'open') {
    throw mapCreateAppointmentError('reschedule_unavailable')
  }

  if (!settings?.online_booking_enabled) {
    throw createError({ statusCode: 403, message: 'Online booking is disabled' })
  }

  // Gate: a slot she could have been shown. The RPC repeats the conflict checks
  // under the master's lock.
  if (services && services.length === serviceIds.length) {
    const [day] = await loadDailySlots({
      supabase,
      profile,
      settings,
      dates: [utcMsToLocalDate(Date.parse(startsAt), getProfileTimezone(profile.schedule))],
      durationMinutes: services.reduce((total, s) => total + s.duration, 0),
      holderHash: readHolderHash(event)
    })

    if (!day?.slots.includes(startsAt)) {
      throw createError({ statusCode: 409, message: 'Slot is unavailable' })
    }
  }

  const newLink = createBookingLinkToken()

  const { data, error } = await supabase.rpc('create_appointment_from_booking', {
    p_username: profile.username,
    p_service_ids: serviceIds,
    p_starts_at: startsAt,
    p_phone: client.phone,
    p_holder_hash: readHolderHash(event) ?? undefined,
    p_future_limit: FUTURE_BOOKINGS_LIMIT,
    p_link_hash: newLink.hash,
    p_replaces_hash: hashBookingLinkToken(token)
  })

  if (error) {
    throw mapCreateAppointmentError(error.message)
  }

  const { created, booking } = parseBookingRpcResult(data)

  if (created) {
    await sendBookingConfirmation(event, {
      phone: client.phone,
      profile,
      settings,
      booking,
      linkToken: newLink.token
    })
  }

  return { token: newLink.token, starts_at: booking.starts_at, status: booking.status }
})

function parseStartsAt(value: unknown) {
  if (typeof value !== 'string' || !ISO_DATETIME_WITH_ZONE_RE.test(value)) {
    throw createError({ statusCode: 400, message: 'starts_at is required' })
  }

  const startsAt = new Date(value)
  if (Number.isNaN(startsAt.getTime())) {
    throw createError({ statusCode: 400, message: 'starts_at must be an ISO datetime string' })
  }

  return startsAt.toISOString()
}
