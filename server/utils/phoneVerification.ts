import { createHmac, randomBytes } from 'node:crypto'

const PHONE_RE = /^\d{10,15}$/
const TOKEN_TTL_SECONDS = 15 * 60

type PhoneVerificationPayload = {
  phone: string
  exp: number
  nonce: string
}

export function normalizePhone(phone: unknown) {
  if (typeof phone !== 'string') {
    throw createError({ statusCode: 400, message: 'Phone is required' })
  }

  const normalized = phone.replace(/\D/g, '')

  if (!PHONE_RE.test(normalized)) {
    throw createError({ statusCode: 400, message: 'Phone must contain 10 to 15 digits' })
  }

  return normalized
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

function sign(value: string) {
  return createHmac('sha256', getTokenSecret()).update(value).digest('base64url')
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
