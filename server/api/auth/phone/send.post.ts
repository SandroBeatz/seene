import { randomInt } from 'node:crypto'

const OTP_TTL_MINUTES = 10

export default defineEventHandler(async (event) => {
  const body = await readBody<{ phone?: string }>(event)
  const phone = normalizePhone(body.phone)
  const code = randomInt(0, 10000).toString().padStart(4, '0')
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString()
  const supabase = useServiceSupabase()

  const [{ error: otpError }, { data: booking, error: bookingError }] = await Promise.all([
    supabase.from('otp_codes').insert({
      phone,
      code,
      expires_at: expiresAt,
      used: false,
      attempts: 0
    }),
    supabase
      .from('bookings')
      .select('client_name')
      .eq('client_phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ])

  if (otpError) {
    throw createError({ statusCode: 500, message: 'Failed to create OTP code' })
  }

  if (bookingError) {
    throw createError({ statusCode: 500, message: 'Failed to check client history' })
  }

  const firstName = getFirstName(booking?.client_name)

  return {
    success: true,
    clientExists: Boolean(booking),
    ...(firstName ? { firstName } : {}),
    code
  }
})

function getFirstName(name: string | null | undefined) {
  return name?.trim().split(/\s+/)[0] || undefined
}
