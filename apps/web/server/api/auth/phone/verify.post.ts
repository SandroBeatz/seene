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

  // Locks the code row, compares and counts the try in one call, so parallel
  // requests can't beat OTP_MAX_ATTEMPTS and only one of them can use the code.
  const { data: result, error: otpError } = await supabase.rpc('verify_otp_code', {
    p_phone: phone,
    p_code_hash: hashOtpCode(phone, code, getTokenSecret()),
    p_max_attempts: OTP_MAX_ATTEMPTS
  })

  if (otpError) {
    throw createError({ statusCode: 500, message: 'Failed to check OTP code' })
  }

  if (result !== 'ok') {
    return {
      success: false,
      error: result
    }
  }

  const [{ data: client, error: clientError }] = await Promise.all([
    supabase
      .from('client')
      .select('first_name')
      .eq('user_id', masterUserId)
      .eq('phone', phone)
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
