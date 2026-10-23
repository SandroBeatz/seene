import { createHash, randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'

export const SLOT_HOLD_MINUTES = 10

const HOLDER_COOKIE = 'seene_holder'

/**
 * The browser that holds a slot, as a hash for the database. The cookie is a
 * random id, created on the first hold; reading never creates one, so
 * availability requests stay cookie-free for new visitors.
 */
export function readHolderHash(event: H3Event) {
  const holder = getCookie(event, HOLDER_COOKIE)
  return holder ? hashHolder(holder) : null
}

export function ensureHolderHash(event: H3Event) {
  let holder = getCookie(event, HOLDER_COOKIE)

  if (!holder) {
    holder = randomBytes(24).toString('base64url')
    setCookie(event, HOLDER_COOKIE, holder, {
      httpOnly: true,
      secure: !import.meta.dev,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    })
  }

  return hashHolder(holder)
}

function hashHolder(holder: string) {
  return createHash('sha256').update(holder).digest('hex')
}
