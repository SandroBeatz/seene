import { randomInt } from 'node:crypto'

const OTP_TTL_MINUTES = 10

export default defineEventHandler(async (event) => {
  const body = await readBody<{ phone?: string }>(event)
  const phone = normalizePhone(body.phone)
  const code = randomInt(0, 10000).toString().padStart(4, '0')
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString()
  const supabase = useServiceSupabase()

  const { error } = await supabase.from('otp_codes').insert({
    phone,
    code,
    expires_at: expiresAt,
    used: false,
    attempts: 0
  })

  if (error) {
    throw createError({ statusCode: 500, message: 'Failed to create OTP code' })
  }

  // TODO: deliver by SMS. Until a provider is wired, the code is returned so the
  // booking UI can show it for testing.
  return { success: true, code }
})
