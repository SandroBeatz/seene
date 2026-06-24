import type { Json } from '#shared/types/supabase'

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
}

type BookingResponse = {
  booking: {
    id: string
    starts_at: string
    ends_at: string
    services: MasterService[]
    master: {
      first_name: string
      last_name: string
    }
  }
}

type MasterService = {
  id: string
  category_id: string | null
  name: string
  description: string | null
  duration: number
  price: number
  color: string
  sort_order: number
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

  if (!verifyPhoneVerificationToken(body.otp_token, phone)) {
    throw createError({
      statusCode: 401,
      message: 'Phone verification token is invalid or expired'
    })
  }

  const supabase = useServiceSupabase()

  const { data: profileRow } = await supabase
    .from('master_profile')
    .select('user_id')
    .eq('username', username)
    .maybeSingle()

  if (profileRow) {
    const { data: settingsRow } = await supabase
      .from('master_settings')
      .select('online_booking_enabled')
      .eq('user_id', profileRow.user_id)
      .maybeSingle()

    if (!settingsRow || !settingsRow.online_booking_enabled) {
      throw createError({ statusCode: 403, message: 'Online booking is disabled' })
    }
  }

  const { data, error } = await supabase.rpc('create_appointment_from_booking', {
    p_username: username,
    p_service_ids: serviceIds,
    p_starts_at: startsAt,
    p_phone: phone,
    p_first_name: firstName ?? undefined,
    p_last_name: lastName ?? undefined,
    p_note: note ?? undefined
  })

  if (error) {
    throw mapCreateAppointmentError(error.message)
  }

  return parseBookingResponse(data)
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

function parseNote(value: unknown) {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: 'note must be a string' })
  }

  return value.trim() || null
}

function mapCreateAppointmentError(message: string) {
  if (message.includes('master_not_found')) {
    return createError({ statusCode: 404, message: 'Master not found' })
  }

  if (message.includes('slot_unavailable')) {
    return createError({ statusCode: 409, message: 'Slot is unavailable' })
  }

  if (message.includes('services_unavailable')) {
    return createError({ statusCode: 400, message: 'One or more services are unavailable' })
  }

  if (message.includes('client_name_required')) {
    return createError({ statusCode: 400, message: 'First name is required for new clients' })
  }

  if (
    message.includes('username_required') ||
    message.includes('services_required') ||
    message.includes('starts_at_required') ||
    message.includes('phone_required')
  ) {
    return createError({ statusCode: 400, message: 'Appointment request is invalid' })
  }

  return createError({ statusCode: 500, message: 'Failed to create appointment' })
}

function parseBookingResponse(value: Json | null): BookingResponse {
  if (!isRecord(value) || !isRecord(value.booking)) {
    throw createError({ statusCode: 500, message: 'Appointment response is invalid' })
  }

  return value as unknown as BookingResponse
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
