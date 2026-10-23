import { describe, it, expect } from 'vitest'
import { bookingLinkState, cancelDeadline } from '../shared/utils/bookingLink'
import {
  createBookingLinkToken,
  hashBookingLinkToken,
  parseBookingLinkToken
} from '../server/utils/bookingLink'
import { formatVisitTime, messageLocale, renderMessage } from '../server/utils/messaging'

const NOW = Date.UTC(2026, 9, 23, 12, 0, 0)
const hoursFromNow = (h: number) => new Date(NOW + h * 3_600_000).toISOString()

function state(overrides: Partial<Parameters<typeof bookingLinkState>[0]> = {}) {
  return bookingLinkState({
    status: 'confirmed',
    startAt: hoursFromNow(48),
    linkExpiresAt: hoursFromNow(72),
    cancelWindowHours: 12,
    now: NOW,
    ...overrides
  })
}

describe('bookingLinkState', () => {
  it('is open while the cancel window is open', () => {
    expect(state()).toBe('open')
    expect(state({ status: 'pending' })).toBe('open')
    expect(state({ startAt: hoursFromNow(12) })).toBe('open')
  })

  it('is late inside the cancel window, until the visit starts', () => {
    expect(state({ startAt: hoursFromNow(11) })).toBe('late')
    expect(state({ startAt: hoursFromNow(0.5) })).toBe('late')
  })

  it('shows a cancelled booking as cancelled', () => {
    expect(state({ status: 'cancelled' })).toBe('cancelled')
    expect(state({ status: 'cancelled', startAt: hoursFromNow(1) })).toBe('cancelled')
  })

  it('is past once the visit started, the link expired or the visit is closed', () => {
    expect(state({ startAt: hoursFromNow(-1), linkExpiresAt: hoursFromNow(23) })).toBe('past')
    expect(state({ linkExpiresAt: hoursFromNow(0) })).toBe('past')
    expect(state({ status: 'cancelled', linkExpiresAt: hoursFromNow(-1) })).toBe('past')
    expect(state({ status: 'completed' })).toBe('past')
    expect(state({ status: 'no_show' })).toBe('past')
  })

  it('a zero-hour window lets her cancel up to the visit', () => {
    expect(state({ startAt: hoursFromNow(0.1), cancelWindowHours: 0 })).toBe('open')
  })
})

describe('cancelDeadline', () => {
  it('is the window before the visit', () => {
    expect(cancelDeadline(hoursFromNow(48), 12)).toBe(NOW + 36 * 3_600_000)
  })
})

describe('booking link token', () => {
  it('is random, 43 url-safe characters, stored only as a hash', () => {
    const a = createBookingLinkToken()
    const b = createBookingLinkToken()
    expect(a.token).toMatch(/^[\w-]{43}$/)
    expect(a.token).not.toBe(b.token)
    expect(a.hash).toBe(hashBookingLinkToken(a.token))
    expect(a.hash).not.toContain(a.token)
  })

  it('rejects anything that cannot be a token', () => {
    const { token } = createBookingLinkToken()
    expect(parseBookingLinkToken(token)).toBe(token)
    expect(parseBookingLinkToken('short')).toBeNull()
    expect(parseBookingLinkToken(`${token}x`)).toBeNull()
    expect(parseBookingLinkToken(`${token.slice(0, 42)}/`)).toBeNull()
    expect(parseBookingLinkToken(123)).toBeNull()
  })
})

describe('messages', () => {
  const booking = {
    template: 'booking_confirmed' as const,
    master: 'Aigul Kasymova',
    when: 'Friday, 24 October, 11:30',
    link: 'https://getseene.app/c/abc'
  }

  it('renders every template in every language with its parameters', () => {
    for (const locale of ['en', 'fr', 'ru'] as const) {
      const text = renderMessage(booking, locale)
      expect(text).toContain(booking.master)
      expect(text).toContain(booking.when)
      expect(text).toContain(booking.link)
      expect(renderMessage({ ...booking, template: 'booking_pending' }, locale)).toContain(
        booking.link
      )
      expect(renderMessage({ template: 'code', code: '0427' }, locale)).toContain('0427')
    }
  })

  it('falls back to English for an unknown language', () => {
    expect(messageLocale('de')).toBe('en')
    expect(messageLocale(undefined)).toBe('en')
    expect(messageLocale('ru')).toBe('ru')
  })

  it('formats the visit in the master’s zone', () => {
    const startAt = '2026-10-24T05:30:00Z' // 11:30 in Bishkek (UTC+6)
    expect(
      formatVisitTime(startAt, { locale: 'en', timezone: 'Asia/Bishkek', hour12: false })
    ).toBe('Saturday, October 24, 11:30')
    expect(
      formatVisitTime(startAt, { locale: 'ru', timezone: 'Asia/Bishkek', hour12: false })
    ).toBe('суббота, 24 октября, 11:30')
  })
})
