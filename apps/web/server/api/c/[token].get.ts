import type { BookingLinkData } from '#shared/types/master'

type LinkedAppointment = {
  id: string
  start_at: string
  duration: number
  price: number | null
  status: string
  service_ids: string[]
}

/** How many moves in a row the old link follows to the current booking. */
const MAX_MOVES = 5

/**
 * The booking behind a personal link (/c/<token>). The link gives access to
 * this one booking only: no client name, phone or history. After the visit (or
 * once the link expires) only the master's page is returned. A booking moved
 * to another time answers `moved` with the new time, so a client who missed
 * the answer after "Move" sees where her booking went.
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
      'expires_at, appointment:appointments!inner(id, user_id, start_at, duration, price, status, service_ids)'
    )
    .eq('token_hash', hashBookingLinkToken(token))
    .maybeSingle()

  if (!link) {
    throw createError({ statusCode: 404, message: 'Booking not found' })
  }

  const { user_id: masterUserId, ...linked } = link.appointment
  const movedTo = linked.status === 'cancelled' ? await findMovedTo(linked.id) : null
  const appointment = movedTo ?? linked

  const [{ data: profile }, { data: settings }, { data: services }] = await Promise.all([
    supabase.from('master_profile').select('username').eq('user_id', masterUserId).maybeSingle(),
    supabase
      .from('master_settings')
      .select('cancel_window_hours')
      .eq('user_id', masterUserId)
      .maybeSingle(),
    supabase
      .from('service')
      .select('id, name, duration, price, price_from, photo_url, color, sort_order')
      .eq('user_id', masterUserId)
      .in('id', appointment.service_ids)
      .order('sort_order')
  ])

  if (!profile) {
    throw createError({ statusCode: 404, message: 'Booking not found' })
  }

  const cancelWindowHours = settings?.cancel_window_hours ?? 12
  const linkState = bookingLinkState({
    status: linked.status,
    startAt: linked.start_at,
    linkExpiresAt: link.expires_at,
    cancelWindowHours
  })
  const state = linkState === 'cancelled' && movedTo ? 'moved' : linkState

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

  /** The booking this one was moved to (following several moves), if it is still on. */
  async function findMovedTo(appointmentId: string): Promise<LinkedAppointment | null> {
    let current = appointmentId
    for (let move = 0; move < MAX_MOVES; move++) {
      const { data: next } = await supabase
        .from('appointments')
        .select('id, start_at, duration, price, status, service_ids')
        .eq('rescheduled_from', current)
        .maybeSingle()

      if (!next) return null
      if (next.status === 'pending' || next.status === 'confirmed') return next
      current = next.id
    }
    return null
  }
})
