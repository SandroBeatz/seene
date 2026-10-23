import { createHash, createHmac, randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'

export const DEVICE_TOKEN_TTL_DAYS = 180

/**
 * A trusted device: after a correct code the client gets a random token in an
 * httpOnly cookie, bound to one phone and one master. With it the next booking
 * with that master needs no code. The database keeps only the token's hash.
 */
export function generateDeviceToken() {
  return randomBytes(32).toString('base64url')
}

export function hashDeviceToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

/** One cookie per master, so a device can be trusted by several masters. */
export function deviceCookieName(masterUserId: string) {
  return `seene_device_${createHash('sha256').update(masterUserId).digest('hex').slice(0, 16)}`
}

/** HMAC of the client IP for rate limits; the IP itself is never stored. */
export function hashIp(ip: string, secret: string) {
  return createHmac('sha256', secret).update(ip).digest('hex')
}

type ServiceSupabase = ReturnType<typeof useServiceSupabase>

export async function issueDeviceToken(
  event: H3Event,
  supabase: ServiceSupabase,
  { phone, masterUserId }: { phone: string; masterUserId: string }
) {
  const token = generateDeviceToken()
  const expiresAt = new Date(Date.now() + DEVICE_TOKEN_TTL_DAYS * 24 * 60 * 60_000)

  const { error } = await supabase.from('client_device_token').insert({
    token_hash: hashDeviceToken(token),
    phone,
    master_user_id: masterUserId,
    expires_at: expiresAt.toISOString()
  })

  if (error) {
    throw createError({ statusCode: 500, message: 'Failed to save device token' })
  }

  // A new token replaces the old one in the cookie; revoke the old row too.
  const previous = getCookie(event, deviceCookieName(masterUserId))
  if (previous) await revokeTokenRow(supabase, previous)

  setCookie(event, deviceCookieName(masterUserId), token, {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt
  })
}

/** The phone this device is trusted for with this master, or null. */
export async function readDevicePhone(
  event: H3Event,
  supabase: ServiceSupabase,
  masterUserId: string
) {
  const token = getCookie(event, deviceCookieName(masterUserId))
  if (!token) return null

  const { data, error } = await supabase
    .from('client_device_token')
    .select('phone')
    .eq('token_hash', hashDeviceToken(token))
    .eq('master_user_id', masterUserId)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, message: 'Failed to check device token' })
  }

  return data?.phone ?? null
}

/** "Not you?": forget this device for this master. */
export async function revokeDeviceToken(
  event: H3Event,
  supabase: ServiceSupabase,
  masterUserId: string
) {
  const name = deviceCookieName(masterUserId)
  const token = getCookie(event, name)
  if (!token) return

  await revokeTokenRow(supabase, token)
  deleteCookie(event, name, { path: '/' })
}

async function revokeTokenRow(supabase: ServiceSupabase, token: string) {
  const { error } = await supabase
    .from('client_device_token')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token_hash', hashDeviceToken(token))
    .is('revoked_at', null)

  if (error) {
    throw createError({ statusCode: 500, message: 'Failed to revoke device token' })
  }
}

/** The master's auth user id by username, or a 404. */
export async function getMasterUserId(supabase: ServiceSupabase, username: unknown) {
  if (typeof username !== 'string' || !username.trim()) {
    throw createError({ statusCode: 400, message: 'Username is required' })
  }

  const { data: profile } = await supabase
    .from('master_profile')
    .select('user_id')
    .eq('username', username.trim())
    .maybeSingle()

  if (!profile) {
    throw createError({ statusCode: 404, message: 'Master not found' })
  }

  return profile.user_id
}
