/**
 * Checks a one-time code. On success the device becomes trusted for this phone
 * and master (see `server/utils/deviceToken.ts`), and only now — after the code —
 * the client's name and whether they are a client of the master are returned.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ phone?: string; code?: string; username?: string }>(event)
  const phone = normalizePhone(body.phone)
  const code = normalizeCode(body.code)
  const supabase = useServiceSupabase()
  const masterUserId = await getMasterUserId(supabase, body.username)

  const { data: otp, error: otpError } = await supabase
    .from('otp_codes')
    .select('id, code, attempts')
    .eq('phone', phone)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (otpError) {
    throw createError({ statusCode: 500, message: 'Failed to load OTP code' })
  }

  if (!otp) {
    return {
      success: false,
      error: 'expired_code'
    }
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    return {
      success: false,
      error: 'too_many_attempts'
    }
  }

  if (otp.code !== code) {
    const attempts = otp.attempts + 1
    const { error: updateError } = await supabase
      .from('otp_codes')
      .update({ attempts })
      .eq('id', otp.id)

    if (updateError) {
      throw createError({ statusCode: 500, message: 'Failed to update OTP attempts' })
    }

    return {
      success: false,
      error: attempts >= OTP_MAX_ATTEMPTS ? 'too_many_attempts' : 'invalid_code'
    }
  }

  // Only the request that flips `used` wins: a parallel request with the same
  // code finds nothing to update and fails.
  const { data: claimed, error: updateError } = await supabase
    .from('otp_codes')
    .update({ used: true })
    .eq('id', otp.id)
    .eq('used', false)
    .select('id')

  if (updateError) {
    throw createError({ statusCode: 500, message: 'Failed to mark OTP code as used' })
  }

  if (!claimed?.length) {
    return {
      success: false,
      error: 'expired_code'
    }
  }

  const [{ data: client, error: clientError }] = await Promise.all([
    supabase
      .from('client')
      .select('first_name')
      .eq('user_id', masterUserId)
      .eq('phone_digits', phone)
      .limit(1)
      .maybeSingle(),
    issueDeviceToken(event, supabase, { phone, masterUserId })
  ])

  if (clientError) {
    throw createError({ statusCode: 500, message: 'Failed to check client' })
  }

  return {
    success: true,
    token: createPhoneVerificationToken(phone),
    clientExists: Boolean(client),
    ...(client?.first_name ? { firstName: client.first_name } : {})
  }
})

function normalizeCode(code: unknown) {
  if (typeof code !== 'string' || !/^\d{4}$/.test(code)) {
    throw createError({ statusCode: 400, message: 'Code must contain 4 digits' })
  }

  return code
}
