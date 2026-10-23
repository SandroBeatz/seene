import type { NearestSlot } from '#shared/types/master'
import { addDays, getProfileTimezone } from '../../../utils/slots'

/**
 * The nearest free slot for the shortest online-bookable service, within the
 * master's booking horizon. Powers "Nearest: tomorrow, 11:30" on the page's
 * Book button; 403 when online booking is off.
 */
export default defineEventHandler(async (event): Promise<NearestSlot> => {
  const username = getRouterParam(event, 'username')
  const supabase = useServiceSupabase()

  if (!username) {
    throw createError({ statusCode: 400, message: 'Username is required' })
  }

  const { data: profile } = await supabase
    .from('master_profile')
    .select('id, user_id, schedule')
    .eq('username', username)
    .maybeSingle()

  if (!profile) {
    throw createError({ statusCode: 404, message: 'Master not found' })
  }

  const [{ data: settingsRow }, { data: services }] = await Promise.all([
    supabase
      .from('master_settings')
      .select(
        'online_booking_enabled, calendar_slot_step_minutes, booking_buffer_minutes, booking_min_notice_minutes, booking_horizon_days, vacation_from, vacation_until'
      )
      .eq('user_id', profile.user_id)
      .maybeSingle(),
    supabase
      .from('service')
      .select('duration')
      .eq('user_id', profile.user_id)
      .eq('is_active', true)
      .eq('show_online', true)
      .order('duration')
      .limit(1)
  ])

  if (!settingsRow?.online_booking_enabled) {
    throw createError({ statusCode: 403, message: 'Online booking is disabled' })
  }

  const timezone = getProfileTimezone(profile.schedule)
  const duration = services?.[0]?.duration

  // Cached briefly at the edge: the hint can be a minute stale, the booking itself
  // re-checks the slot.
  setResponseHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=60')

  if (!duration) return { start_at: null, timezone }

  const today = todayIn(timezone)
  const dates = buildDateRange(today, addDays(today, settingsRow.booking_horizon_days - 1))
  const days = await loadDailySlots({
    supabase,
    profile,
    settings: settingsRow,
    dates,
    durationMinutes: duration
  })

  return { start_at: days.find((day) => day.slots.length)?.slots[0] ?? null, timezone }
})
