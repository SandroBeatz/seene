/**
 * The founding masters form. Spam protection without a captcha: a hidden field
 * people never fill (`website`), a minimum time between showing and sending the
 * form, and at most WAITLIST_MAX_PER_IP_HOUR applications per IP. A bot caught by
 * the first two gets the same answer as a person, so it learns nothing. The same
 * contact sent again keeps the first application.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    name?: unknown
    contact?: unknown
    city?: unknown
    specialty?: unknown
    locale?: unknown
    website?: unknown
    shown_at?: unknown
  }>(event)

  const input = parseWaitlistInput(body ?? {})
  if (!input) {
    throw createError({ statusCode: 400, message: 'Application is invalid' })
  }

  const shownAt = typeof body.shown_at === 'number' ? body.shown_at : 0
  if (body.website || Date.now() - shownAt < WAITLIST_MIN_FILL_MS) {
    return { ok: true }
  }

  const supabase = useServiceSupabase()
  const ip = getRequestIP(event, { xForwardedFor: true })
  const ipHash = ip ? hashIp(ip, getTokenSecret()) : null

  if (ipHash) {
    const { count, error } = await supabase
      .from('waitlist')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gt('created_at', new Date(Date.now() - 60 * 60_000).toISOString())

    if (error) {
      throw createError({ statusCode: 500, message: 'Failed to check the limit' })
    }
    if ((count ?? 0) >= WAITLIST_MAX_PER_IP_HOUR) {
      throw createError({ statusCode: 429, message: 'Too many applications' })
    }
  }

  const locale = ['en', 'fr', 'ru'].includes(body.locale as string) ? (body.locale as string) : 'en'

  const { error } = await supabase.from('waitlist').insert({
    name: input.name,
    contact: input.contact,
    city: input.city,
    specialty: input.specialty,
    locale,
    ip_hash: ipHash
  })

  // 23505: this contact applied already, the first application stays.
  if (error && error.code !== '23505') {
    throw createError({ statusCode: 500, message: 'Failed to save the application' })
  }

  return { ok: true }
})
