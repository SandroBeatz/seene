import type { H3Event } from 'h3'
import type { Json } from '#shared/types/supabase'
import { getProfileTimezone } from './slots'

/** Future online bookings one phone may have with one master. */
export const FUTURE_BOOKINGS_LIMIT = 2

/** A booking as create_appointment_from_booking returns it. */
export type OnlineBooking = {
  id: string
  starts_at: string
  ends_at: string
  status: 'pending' | 'confirmed'
  services: {
    id: string
    category_id: string | null
    name: string
    description: string | null
    duration: number
    price: number
    color: string
    sort_order: number
  }[]
  master: {
    first_name: string
    last_name: string
  }
}

/** The RPC result: `created` is false when a repeated tap returned the first booking. */
export function parseBookingRpcResult(value: Json | null) {
  if (!isRecord(value) || !isRecord(value.booking)) {
    throw createError({ statusCode: 500, message: 'Appointment response is invalid' })
  }

  return {
    created: value.created !== false,
    booking: value.booking as unknown as OnlineBooking
  }
}

export function mapCreateAppointmentError(message: string) {
  if (message.includes('master_not_found')) {
    return createError({ statusCode: 404, message: 'Master not found' })
  }

  // Blacklisted by the master: refused without saying why.
  if (message.includes('booking_refused')) {
    return createError({
      statusCode: 403,
      message: 'Booking is not available',
      data: { code: 'booking_refused' }
    })
  }

  if (message.includes('booking_limit')) {
    return createError({
      statusCode: 409,
      message: 'Too many upcoming bookings',
      data: { code: 'booking_limit', limit: FUTURE_BOOKINGS_LIMIT }
    })
  }

  // The booking being moved can no longer be cancelled (window closed,
  // cancelled already, or not hers).
  if (message.includes('reschedule_unavailable')) {
    return createError({
      statusCode: 409,
      message: 'The booking can no longer be moved',
      data: { code: 'reschedule_unavailable' }
    })
  }

  if (message.includes('slot_unavailable')) {
    return createError({ statusCode: 409, message: 'Slot is unavailable' })
  }

  if (message.includes('services_unavailable')) {
    return createError({ statusCode: 400, message: 'One or more services are unavailable' })
  }

  if (message.includes('client_name_required')) {
    return createError({ statusCode: 400, message: 'First name is required for new clients' })
  }

  if (
    message.includes('username_required') ||
    message.includes('services_required') ||
    message.includes('starts_at_required') ||
    message.includes('phone_required')
  ) {
    return createError({ statusCode: 400, message: 'Appointment request is invalid' })
  }

  return createError({ statusCode: 500, message: 'Failed to create appointment' })
}

/**
 * The confirmation with the personal link, in the master's language. A failed
 * message never undoes the booking: it is logged and the link is still returned.
 */
export async function sendBookingConfirmation(
  event: H3Event,
  {
    phone,
    profile,
    settings,
    booking,
    linkToken
  }: {
    phone: string
    profile: { first_name: string; last_name: string; schedule: unknown }
    settings: { language: string | null; time_format: number | null } | null
    booking: OnlineBooking
    linkToken: string
  }
) {
  const locale = messageLocale(settings?.language)
  const link = bookingLinkUrl(event, linkToken, locale)

  try {
    await sendMessage(
      { phone, channel: 'whatsapp' },
      {
        template: booking.status === 'confirmed' ? 'booking_confirmed' : 'booking_pending',
        master: `${profile.first_name} ${profile.last_name}`.trim(),
        when: formatVisitTime(booking.starts_at, {
          locale,
          timezone: getProfileTimezone(profile.schedule),
          hour12: settings?.time_format === 12
        }),
        link
      },
      locale
    )
  } catch (sendError) {
    console.error('[booking] confirmation not sent', sendError)
  }

  return link
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
