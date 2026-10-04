import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const TOKEN_TTL_SECONDS = 15 * 60

type PhoneVerificationPayload = {
  phone: string
  exp: number
  nonce: string
}

/** Validates an E.164 phone ('+996555123456') and returns it canonicalized. */
export function normalizePhone(phone: unknown) {
  if (typeof phone !== 'string') {
    throw createError({ statusCode: 400, message: 'Phone is required' })
  }

  const normalized = phone.trim().startsWith('+') ? toE164(phone) : null

  if (!normalized) {
    throw createError({ statusCode: 400, message: 'Phone must be a valid E.164 number' })
  }

  return normalized
}

/**
 * A phone is confirmed once — when the client first books and passes the SMS
 * check. Every later booking with that number skips the OTP step.
 */
export async function isPhoneVerified(
  supabase: ReturnType<typeof useServiceSupabase>,
  phone: string
) {
  const { data, error } = await supabase
    .from('phone_verification')
    .select('phone')
    .eq('phone', phone)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, message: 'Failed to check phone verification' })
  }

  return Boolean(data)
}

export async function markPhoneVerified(
  supabase: ReturnType<typeof useServiceSupabase>,
  phone: string
) {
  const { error } = await supabase
    .from('phone_verification')
    .upsert({ phone, verified_at: new Date().toISOString() }, { onConflict: 'phone' })

  if (error) {
    throw createError({ statusCode: 500, message: 'Failed to save phone verification' })
  }
}

export function createPhoneVerificationToken(phone: string) {
  const payload: PhoneVerificationPayload = {
    phone,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    nonce: randomBytes(16).toString('hex')
  }
  const encodedPayload = toBase64Url(JSON.stringify(payload))
  const signature = sign(encodedPayload)

  return `${encodedPayload}.${signature}`
}

export function verifyPhoneVerificationToken(token: unknown, phone: string) {
  if (typeof token !== 'string') {
    return false
  }

  const [encodedPayload, signature] = token.split('.')

  if (!encodedPayload || !signature || !isValidSignature(encodedPayload, signature)) {
    return false
  }

  const payload = parsePayload(encodedPayload)

  return Boolean(payload && payload.phone === phone && payload.exp > Math.floor(Date.now() / 1000))
}

function sign(value: string) {
  return createHmac('sha256', getTokenSecret()).update(value).digest('base64url')
}

function isValidSignature(value: string, signature: string) {
  const expected = sign(value)
  const expectedBuffer = Buffer.from(expected)
  const signatureBuffer = Buffer.from(signature)

  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  )
}

function parsePayload(value: string): PhoneVerificationPayload | null {
  try {
    const payload = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8')
    ) as Partial<PhoneVerificationPayload>

    if (
      typeof payload.phone === 'string' &&
      typeof payload.exp === 'number' &&
      typeof payload.nonce === 'string'
    ) {
      return payload as PhoneVerificationPayload
    }
  } catch {
    return null
  }

  return null
}

function getTokenSecret() {
  const config = useRuntimeConfig()
  const secret = config.phoneVerificationTokenSecret || config.supabaseServiceRoleKey

  if (!secret) {
    throw createError({
      statusCode: 500,
      message: 'Phone verification token secret is not configured'
    })
  }

  return secret
}

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}
