import { createHash, randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'

/** 32 random bytes in base64url: 43 characters. */
const LINK_TOKEN_RE = /^[\w-]{43}$/

/**
 * A personal link to one booking (/c/<token>): cancel or move it without
 * signing in. The token is random (256 bits) and the database keeps only its
 * SHA-256 hash, so a leaked table opens nothing.
 */
export function createBookingLinkToken() {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: hashBookingLinkToken(token) }
}

export function hashBookingLinkToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

/** The token from a URL or a request body, or null when it cannot be one. */
export function parseBookingLinkToken(value: unknown) {
  return typeof value === 'string' && LINK_TOKEN_RE.test(value) ? value : null
}

/** Absolute link in the master's language (the page language is the master's). */
export function bookingLinkUrl(event: H3Event, token: string, locale: string) {
  const prefix = locale === 'en' ? '' : `/${locale}`
  return `${getRequestURL(event).origin}${prefix}/c/${token}`
}
