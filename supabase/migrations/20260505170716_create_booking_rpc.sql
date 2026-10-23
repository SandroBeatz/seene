create or replace function public.create_booking(
  p_username text,
  p_service_ids uuid[],
  p_starts_at timestamptz,
  p_phone text,
  p_note text default null
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_master record;
  v_duration int;
  v_service_count int;
  v_services jsonb;
  v_ends_at timestamptz;
  v_booking bookings%rowtype;
  v_local_start timestamp;
  v_local_date date;
  v_local_time time;
  v_local_day_of_week int;
begin
  if p_username is null or length(btrim(p_username)) = 0 then
    raise exception 'username_required';
  end if;

  if p_service_ids is null or cardinality(p_service_ids) = 0 then
    raise exception 'services_required';
  end if;

  if p_starts_at is null then
    raise exception 'starts_at_required';
  end if;

  if p_phone is null or length(btrim(p_phone)) = 0 then
    raise exception 'phone_required';
  end if;

  select
    id,
    user_id,
    first_name,
    last_name,
    coalesce(nullif(schedule->>'timezone', ''), 'UTC') as timezone
  into v_master
  from master_profile
  where username = p_username;

  if not found then
    raise exception 'master_not_found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_master.id::text, 0));

  select
    count(*),
    coalesce(sum(duration), 0)::int,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'category_id', category_id,
          'name', name,
          'description', description,
          'duration', duration,
          'price', price,
          'color', color,
          'sort_order', sort_order
        )
        order by sort_order, name
      ),
      '[]'::jsonb
    )
  into v_service_count, v_duration, v_services
  from service
  where user_id = v_master.user_id
    and is_active = true
    and id = any(p_service_ids);

  if v_service_count <> cardinality(p_service_ids) then
    raise exception 'services_unavailable';
  end if;

  v_ends_at := p_starts_at + make_interval(mins => v_duration);
  v_local_start := p_starts_at at time zone v_master.timezone;
  v_local_date := v_local_start::date;
  v_local_time := v_local_start::time;
  v_local_day_of_week := extract(dow from v_local_start)::int;

  if not exists (
    select 1
    from availability
    where master_id = v_master.id
      and (specific_date = v_local_date or day_of_week = v_local_day_of_week)
      and v_local_time >= start_time
      and (v_local_time + make_interval(mins => v_duration))::time <= end_time
      and mod((extract(epoch from (v_local_time - start_time)) / 60)::int, slot_duration) = 0
  ) then
    raise exception 'slot_unavailable';
  end if;

  if exists (
    select 1
    from bookings
    where master_id = v_master.id
      and status <> 'cancelled'
      and starts_at < v_ends_at
      and ends_at > p_starts_at
  ) then
    raise exception 'slot_unavailable';
  end if;

  insert into bookings (
    master_id,
    client_phone,
    service_ids,
    starts_at,
    ends_at,
    note
  )
  values (
    v_master.id,
    p_phone,
    p_service_ids,
    p_starts_at,
    v_ends_at,
    nullif(btrim(p_note), '')
  )
  returning * into v_booking;

  return jsonb_build_object(
    'booking',
    jsonb_build_object(
      'id', v_booking.id,
      'starts_at', v_booking.starts_at,
      'ends_at', v_booking.ends_at,
      'services', v_services,
      'master', jsonb_build_object(
        'first_name', v_master.first_name,
        'last_name', v_master.last_name
      )
    )
  );
end;
$$;

revoke execute on function public.create_booking(text, uuid[], timestamptz, text, text)
  from public, anon, authenticated;
grant execute on function public.create_booking(text, uuid[], timestamptz, text, text)
  to service_role;
