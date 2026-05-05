const MAX_OTP_ATTEMPTS = 3

export default defineEventHandler(async (event) => {
  const body = await readBody<{ phone?: string; code?: string }>(event)
  const phone = normalizePhone(body.phone)
  const code = normalizeCode(body.code)
  const supabase = useServiceSupabase()

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

  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
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
      error: attempts >= MAX_OTP_ATTEMPTS ? 'too_many_attempts' : 'invalid_code'
    }
  }

  const { error: updateError } = await supabase
    .from('otp_codes')
    .update({ used: true })
    .eq('id', otp.id)

  if (updateError) {
    throw createError({ statusCode: 500, message: 'Failed to mark OTP code as used' })
  }

  return {
    success: true,
    token: createPhoneVerificationToken(phone)
  }
})

function normalizeCode(code: unknown) {
  if (typeof code !== 'string' || !/^\d{4}$/.test(code)) {
    throw createError({ statusCode: 400, message: 'Code must contain 4 digits' })
  }

  return code
}
