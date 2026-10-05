import { randomInt } from 'node:crypto'

const OTP_TTL_MINUTES = 10
const CODE_CHANNELS = ['whatsapp', 'telegram'] as const

export default defineEventHandler(async (event) => {
  const body = await readBody<{ phone?: string; channel?: string }>(event)
  const phone = normalizePhone(body.phone)
  const channel = CODE_CHANNELS.find((item) => item === body.channel)

  if (!channel) {
    throw createError({ statusCode: 400, message: "Channel must be 'whatsapp' or 'telegram'" })
  }
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

  // TODO: deliver the code via `channel` (WhatsApp / Telegram). Until a provider
  // is wired, the code is returned so the booking UI can show it for testing.
  return { success: true, channel, code }
})
