import { getProfileTimezone, utcMsToLocalDate } from '../../../utils/slots'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ISO_DATETIME_WITH_ZONE_RE = /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/

type AppointmentRequestBody = {
  service_ids?: unknown
  starts_at?: unknown
  phone?: unknown
  first_name?: unknown
  last_name?: unknown
  note?: unknown
  otp_token?: unknown
  reminders_consent?: unknown
  marketing_consent?: unknown
}

type BookingResponse = {
  /** Personal link to cancel or move this booking */
  link: string
  booking: OnlineBooking
}

export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username')

  if (!username) {
    throw createError({ statusCode: 400, message: 'Username is required' })
  }

  const body = await readBody<AppointmentRequestBody>(event)
  const phone = normalizePhone(body.phone)
  const serviceIds = parseServiceIds(body.service_ids)
  const startsAt = parseStartsAt(body.starts_at)
  const firstName = parseName(body.first_name, 'first_name')
  const lastName = parseName(body.last_name, 'last_name')
  const note = parseNote(body.note)
  const remindersConsent = parseConsent(body.reminders_consent, 'reminders_consent')
  const marketingConsent = parseConsent(body.marketing_consent, 'marketing_consent')

  const supabase = useServiceSupabase()

  // Step 1: load master profile (schedule needed for slot validation)
  const { data: profile } = await supabase
    .from('master_profile')
    .select('id, user_id, first_name, last_name, schedule')
    .eq('username', username)
    .maybeSingle()

  // The phone is proven either by a code entered just now (otp_token) or by
  // this device, trusted for this phone with this master after an earlier code.
  const phoneVerified =
    verifyPhoneVerificationToken(body.otp_token, phone) ||
    (profile ? (await readDevicePhone(event, supabase, profile.user_id)) === phone : false)

  if (!phoneVerified) {
    throw createError({ statusCode: 401, message: 'Phone verification is required' })
  }

  const holderHash = readHolderHash(event)
  let messageSettings: { language: string | null; time_format: number | null } | null = null

  // If master not found, let the RPC return master_not_found
  if (profile) {
    const [{ data: settingsRow }, { data: services }] = await Promise.all([
      supabase
        .from('master_settings')
        .select(
          'online_booking_enabled, booking_min_notice_minutes, booking_buffer_minutes, calendar_slot_step_minutes, vacation_from, vacation_until, language, time_format'
        )
        .eq('user_id', profile.user_id)
        .maybeSingle(),
      supabase
        .from('service')
        .select('id, duration')
        .eq('user_id', profile.user_id)
        .eq('is_active', true)
        .eq('show_online', true)
        .in('id', serviceIds)
    ])

    if (!settingsRow || !settingsRow.online_booking_enabled) {
      throw createError({ statusCode: 403, message: 'Online booking is disabled' })
    }
    messageSettings = settingsRow

    // Gate: the slot is one she could have been shown (schedule, breaks, step,
    // notice, vacation, other clients' holds). The RPC repeats the conflict
    // checks under the master's lock.
    if (services && services.length === serviceIds.length) {
      const startsAtMs = new Date(startsAt).getTime()
      const [day] = await loadDailySlots({
        supabase,
        profile,
        settings: settingsRow,
        dates: [utcMsToLocalDate(startsAtMs, getProfileTimezone(profile.schedule))],
        durationMinutes: services.reduce((total, s) => total + s.duration, 0),
        holderHash
      })

      if (!day?.slots.includes(startsAt) && !(await isOwnRecentBooking(profile.user_id))) {
        throw createError({ statusCode: 409, message: 'Slot is unavailable' })
      }
    }
  }

  const link = createBookingLinkToken()

  const { data, error } = await supabase.rpc('create_appointment_from_booking', {
    p_username: username,
    p_service_ids: serviceIds,
    p_starts_at: startsAt,
    p_phone: phone,
    p_first_name: firstName ?? undefined,
    p_last_name: lastName ?? undefined,
    p_note: note ?? undefined,
    p_holder_hash: holderHash ?? undefined,
    p_reminders_consent: remindersConsent ?? undefined,
    p_marketing_consent: marketingConsent ?? undefined,
    p_future_limit: FUTURE_BOOKINGS_LIMIT,
    p_link_hash: link.hash
  })

  if (error) {
    throw mapCreateAppointmentError(error.message)
  }

  const { created, booking } = parseBookingRpcResult(data)

  // The confirmation goes once, for the booking just made (not on a repeated tap).
  const linkUrl =
    created && profile
      ? await sendBookingConfirmation(event, {
          phone,
          profile,
          settings: messageSettings,
          booking,
          linkToken: link.token
        })
      : bookingLinkUrl(event, link.token, messageLocale(messageSettings?.language))

  return { link: linkUrl, booking } satisfies BookingResponse

  /**
   * A repeated tap after the booking went through: her own appointment now
   * occupies the slot. Let the RPC answer with that booking instead of a 409.
   */
  async function isOwnRecentBooking(masterUserId: string) {
    const { data: rows } = await supabase
      .from('appointments')
      .select('id, client!inner(phone)')
      .eq('user_id', masterUserId)
      .eq('start_at', startsAt)
      .eq('source', 'online_booking')
      .neq('status', 'cancelled')
      .eq('client.phone', phone)
      .gt('created_at', new Date(Date.now() - 10 * 60_000).toISOString())
      .limit(1)

    return Boolean(rows?.length)
  }
})

function parseServiceIds(value: unknown) {
  if (!Array.isArray(value)) {
    throw createError({ statusCode: 400, message: 'service_ids must be an array' })
  }

  const serviceIds = [...new Set(value)]

  if (
    serviceIds.length === 0 ||
    serviceIds.some((id) => typeof id !== 'string' || !UUID_RE.test(id))
  ) {
    throw createError({ statusCode: 400, message: 'service_ids must contain UUIDs' })
  }

  return serviceIds as string[]
}

function parseStartsAt(value: unknown) {
  if (typeof value !== 'string' || !ISO_DATETIME_WITH_ZONE_RE.test(value)) {
    throw createError({ statusCode: 400, message: 'starts_at is required' })
  }

  const startsAt = new Date(value)

  if (Number.isNaN(startsAt.getTime())) {
    throw createError({ statusCode: 400, message: 'starts_at must be an ISO datetime string' })
  }

  return startsAt.toISOString()
}

function parseName(value: unknown, field: string) {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: `${field} must be a string` })
  }

  return value.trim() || null
}

function parseConsent(value: unknown, field: string) {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value !== 'boolean') {
    throw createError({ statusCode: 400, message: `${field} must be a boolean` })
  }

  return value
}

function parseNote(value: unknown) {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: 'note must be a string' })
  }

  return value.trim() || null
}
