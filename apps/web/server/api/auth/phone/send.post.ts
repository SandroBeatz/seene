import { randomInt } from 'node:crypto'

const CODE_CHANNELS = ['whatsapp', 'telegram'] as const

export default defineEventHandler(async (event) => {
  const body = await readBody<{ phone?: string; channel?: string; locale?: string }>(event)
  const phone = normalizePhone(body.phone)
  const channel = CODE_CHANNELS.find((item) => item === body.channel)

  if (!channel) {
    throw createError({ statusCode: 400, message: "Channel must be 'whatsapp' or 'telegram'" })
  }

  const supabase = useServiceSupabase()
  const now = Date.now()
  const hourAgo = new Date(now - 60 * 60_000).toISOString()
  const ip = getRequestIP(event, { xForwardedFor: true })
  const ipHash = ip ? hashIp(ip, getTokenSecret()) : null

  const [phoneSent, ipSent] = await Promise.all([
    supabase.from('otp_codes').select('created_at').eq('phone', phone).gt('created_at', hourAgo),
    ipHash
      ? supabase
          .from('otp_codes')
          .select('created_at')
          .eq('ip_hash', ipHash)
          .gt('created_at', hourAgo)
      : Promise.resolve({ data: [], error: null })
  ])

  if (phoneSent.error || ipSent.error) {
    throw createError({ statusCode: 500, message: 'Failed to check OTP limits' })
  }

  const block = otpSendBlock({
    phoneSentAt: (phoneSent.data ?? []).map((row) => new Date(row.created_at).getTime()),
    ipSentAt: (ipSent.data ?? []).map((row) => new Date(row.created_at).getTime()),
    now
  })

  if (block) {
    setResponseHeader(event, 'Retry-After', block.retryAfterSeconds)
    throw createError({
      statusCode: 429,
      message: 'Too many codes requested',
      data: block
    })
  }

  const code = randomInt(0, 10000).toString().padStart(4, '0')
  const expiresAt = new Date(now + OTP_TTL_MINUTES * 60_000).toISOString()

  const { error } = await supabase.from('otp_codes').insert({
    phone,
    code,
    channel,
    ip_hash: ipHash,
    expires_at: expiresAt,
    used: false,
    attempts: 0
  })

  if (error) {
    throw createError({ statusCode: 500, message: 'Failed to create OTP code' })
  }

  try {
    await sendMessage({ phone, channel }, { template: 'code', code }, messageLocale(body.locale))
  } catch {
    throw createError({ statusCode: 502, message: 'Failed to send the code' })
  }

  // Until a real provider delivers codes, the code is also returned where
  // exposing it is allowed: local dev, or an environment that sets
  // NUXT_OTP_EXPOSE_CODE=true for testing.
  const exposeCode = import.meta.dev || useRuntimeConfig().otpExposeCode

  return { success: true, channel, ...(exposeCode ? { code } : {}) }
})
