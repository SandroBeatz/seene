import { describe, it, expect } from 'vitest'
import {
  OTP_MAX_PER_IP_HOUR,
  OTP_MAX_PER_PHONE_HOUR,
  OTP_RESEND_SECONDS,
  otpSendBlock
} from '../server/utils/otpPolicy'

const NOW = Date.UTC(2026, 9, 23, 12, 0, 0)
const minutesAgo = (m: number) => NOW - m * 60_000

describe('otpSendBlock', () => {
  it('allows the first code', () => {
    expect(otpSendBlock({ phoneSentAt: [], ipSentAt: [], now: NOW })).toBeNull()
  })

  it(`asks to wait ${OTP_RESEND_SECONDS}s between codes to one phone`, () => {
    expect(otpSendBlock({ phoneSentAt: [NOW - 20_000], ipSentAt: [], now: NOW })).toEqual({
      reason: 'resend_too_soon',
      retryAfterSeconds: 40
    })
    expect(otpSendBlock({ phoneSentAt: [NOW - 61_000], ipSentAt: [], now: NOW })).toBeNull()
  })

  it(`allows at most ${OTP_MAX_PER_PHONE_HOUR} codes per phone an hour`, () => {
    const sent = [minutesAgo(50), minutesAgo(30), minutesAgo(10)]
    expect(otpSendBlock({ phoneSentAt: sent, ipSentAt: [], now: NOW })).toEqual({
      reason: 'phone_limit',
      // The code sent 50 minutes ago leaves the window in 10 minutes.
      retryAfterSeconds: 600
    })
  })

  it('ignores codes older than an hour', () => {
    const sent = [minutesAgo(90), minutesAgo(70), minutesAgo(10)]
    expect(otpSendBlock({ phoneSentAt: sent, ipSentAt: [], now: NOW })).toBeNull()
  })

  it(`allows at most ${OTP_MAX_PER_IP_HOUR} codes per IP an hour`, () => {
    const sent = Array.from({ length: OTP_MAX_PER_IP_HOUR }, (_, i) => minutesAgo(55 - i))
    expect(otpSendBlock({ phoneSentAt: [], ipSentAt: sent, now: NOW })).toEqual({
      reason: 'ip_limit',
      retryAfterSeconds: 300
    })
  })
})
