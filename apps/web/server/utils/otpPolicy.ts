/**
 * One-time code rules from the master page spec. Pure, so it is unit-tested
 * without a server (test/otpPolicy.test.ts).
 */
export const OTP_TTL_MINUTES = 5
export const OTP_MAX_ATTEMPTS = 5
export const OTP_RESEND_SECONDS = 60
export const OTP_MAX_PER_PHONE_HOUR = 3
export const OTP_MAX_PER_IP_HOUR = 10

export type OtpSendBlock = {
  reason: 'resend_too_soon' | 'phone_limit' | 'ip_limit'
  retryAfterSeconds: number
}

/**
 * Whether a new code may be sent. `phoneSentAt` / `ipSentAt` are the creation
 * times (ms) of codes sent in the last hour to this phone / from this IP.
 */
export function otpSendBlock(input: {
  phoneSentAt: number[]
  ipSentAt: number[]
  now: number
}): OtpSendBlock | null {
  const hourAgo = input.now - 60 * 60_000
  const phoneRecent = input.phoneSentAt.filter((t) => t > hourAgo).sort((a, b) => a - b)
  const ipRecent = input.ipSentAt.filter((t) => t > hourAgo).sort((a, b) => a - b)

  const latest = phoneRecent.at(-1)
  if (latest !== undefined && input.now - latest < OTP_RESEND_SECONDS * 1000) {
    return {
      reason: 'resend_too_soon',
      retryAfterSeconds: Math.ceil((latest + OTP_RESEND_SECONDS * 1000 - input.now) / 1000)
    }
  }

  if (phoneRecent.length >= OTP_MAX_PER_PHONE_HOUR) {
    return {
      reason: 'phone_limit',
      retryAfterSeconds: secondsUntilFree(phoneRecent, OTP_MAX_PER_PHONE_HOUR, input.now)
    }
  }

  if (ipRecent.length >= OTP_MAX_PER_IP_HOUR) {
    return {
      reason: 'ip_limit',
      retryAfterSeconds: secondsUntilFree(ipRecent, OTP_MAX_PER_IP_HOUR, input.now)
    }
  }

  return null
}

// The window frees a slot when the oldest code that keeps it full turns an hour old.
function secondsUntilFree(sortedTimes: number[], limit: number, now: number) {
  const oldest = sortedTimes[sortedTimes.length - limit]!
  return Math.max(1, Math.ceil((oldest + 60 * 60_000 - now) / 1000))
}
