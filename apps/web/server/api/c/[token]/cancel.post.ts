const REASON_MAX_LENGTH = 200

/** Cancels the booking behind a personal link while the cancel window is open. */
export default defineEventHandler(async (event) => {
  const token = parseBookingLinkToken(getRouterParam(event, 'token'))
  if (!token) {
    throw createError({ statusCode: 404, message: 'Booking not found' })
  }

  const body = await readBody<{ reason?: unknown }>(event)
  const reason =
    typeof body?.reason === 'string' ? body.reason.trim().slice(0, REASON_MAX_LENGTH) : ''

  const { data, error } = await useServiceSupabase().rpc('cancel_appointment_by_link', {
    p_token_hash: hashBookingLinkToken(token),
    p_reason: reason || undefined
  })

  if (error) {
    if (error.message.includes('link_not_found')) {
      throw createError({ statusCode: 404, message: 'Booking not found' })
    }
    if (error.message.includes('cancel_window_closed')) {
      throw createError({
        statusCode: 409,
        message: 'The cancel window has closed',
        data: { code: 'cancel_window_closed' }
      })
    }
    if (error.message.includes('not_cancellable')) {
      throw createError({
        statusCode: 409,
        message: 'The booking cannot be cancelled',
        data: { code: 'not_cancellable' }
      })
    }
    throw createError({ statusCode: 500, message: 'Failed to cancel the booking' })
  }

  return data as { id: string; status: string }
})
