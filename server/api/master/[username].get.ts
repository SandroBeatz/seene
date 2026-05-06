export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username')
  const supabase = useSupabase()

  if (!username) {
    throw createError({ statusCode: 400, message: 'Username is required' })
  }

  const { data: profile, error: profileError } = await supabase
    .from('master_profile')
    .select(
      'id, user_id, first_name, last_name, username, specializations, city, address, house_number, zip_code, country, works_at_place, can_travel'
    )
    .eq('username', username)
    .single()

  if (profileError || !profile) {
    throw createError({ statusCode: 404, message: 'Master not found' })
  }

  const [{ data: categories }, { data: services }] = await Promise.all([
    supabase
      .from('service_category')
      .select('id, name, sort_order')
      .eq('user_id', profile.user_id)
      .order('sort_order'),
    supabase
      .from('service')
      .select('id, category_id, name, description, duration, price, color, sort_order')
      .eq('user_id', profile.user_id)
      .eq('is_active', true)
      .order('sort_order')
  ])

  return {
    profile,
    categories: categories ?? [],
    services: services ?? []
  }
})
