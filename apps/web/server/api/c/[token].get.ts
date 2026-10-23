import type { BookingLinkData } from '#shared/types/master'

/**
 * The booking behind a personal link (/c/<token>). The link gives access to
 * this one booking only: no client name, phone or history. After the visit (or
 * once the link expires) only the master's page is returned.
 */
export default defineEventHandler(async (event): Promise<BookingLinkData> => {
  const token = parseBookingLinkToken(getRouterParam(event, 'token'))
  if (!token) {
    throw createError({ statusCode: 404, message: 'Booking not found' })
  }

  const supabase = useServiceSupabase()

  const { data: link } = await supabase
    .from('booking_link')
    .select(
      'expires_at, appointment:appointments!inner(user_id, start_at, duration, price, status, service_ids)'
    )
    .eq('token_hash', hashBookingLinkToken(token))
    .maybeSingle()

  if (!link) {
    throw createError({ statusCode: 404, message: 'Booking not found' })
  }

  const appointment = link.appointment

  const [{ data: profile }, { data: settings }, { data: services }] = await Promise.all([
    supabase
      .from('master_profile')
      .select('username')
      .eq('user_id', appointment.user_id)
      .maybeSingle(),
    supabase
      .from('master_settings')
      .select('cancel_window_hours')
      .eq('user_id', appointment.user_id)
      .maybeSingle(),
    supabase
      .from('service')
      .select('id, name, duration, price, price_from, photo_url, color, sort_order')
      .eq('user_id', appointment.user_id)
      .in('id', appointment.service_ids)
      .order('sort_order')
  ])

  if (!profile) {
    throw createError({ statusCode: 404, message: 'Booking not found' })
  }

  const cancelWindowHours = settings?.cancel_window_hours ?? 12
  const state = bookingLinkState({
    status: appointment.status,
    startAt: appointment.start_at,
    linkExpiresAt: link.expires_at,
    cancelWindowHours
  })

  if (state === 'past') {
    return { state, username: profile.username, booking: null }
  }

  const startMs = Date.parse(appointment.start_at)

  return {
    state,
    username: profile.username,
    booking: {
      starts_at: new Date(startMs).toISOString(),
      ends_at: new Date(startMs + appointment.duration * 60_000).toISOString(),
      status: appointment.status,
      price: appointment.price,
      services: (services ?? []).map(({ sort_order: _order, ...service }) => service),
      cancel_until: new Date(cancelDeadline(appointment.start_at, cancelWindowHours)).toISOString()
    }
  }
})
