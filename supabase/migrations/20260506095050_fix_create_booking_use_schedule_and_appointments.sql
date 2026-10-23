
CREATE OR REPLACE FUNCTION create_booking(
  p_username text,
  p_service_ids uuid[],
  p_starts_at timestamptz,
  p_phone text,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_master record;
  v_duration int;
  v_service_count int;
  v_services jsonb;
  v_ends_at timestamptz;
  v_booking bookings%rowtype;
  v_local_start timestamp;
  v_local_date date;
  v_local_time time;
  v_local_dow int;
  v_day_name text;
  v_work_start time;
  v_work_end time;
  v_day_enabled boolean;
BEGIN
  IF p_username IS NULL OR length(btrim(p_username)) = 0 THEN
    RAISE EXCEPTION 'username_required';
  END IF;

  IF p_service_ids IS NULL OR cardinality(p_service_ids) = 0 THEN
    RAISE EXCEPTION 'services_required';
  END IF;

  IF p_starts_at IS NULL THEN
    RAISE EXCEPTION 'starts_at_required';
  END IF;

  IF p_phone IS NULL OR length(btrim(p_phone)) = 0 THEN
    RAISE EXCEPTION 'phone_required';
  END IF;

  SELECT
    id,
    user_id,
    first_name,
    last_name,
    schedule,
    coalesce(nullif(schedule->>'timezone', ''), 'UTC') AS timezone
  INTO v_master
  FROM master_profile
  WHERE username = p_username;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'master_not_found';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_master.id::text, 0));

  SELECT
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
        ORDER BY sort_order, name
      ),
      '[]'::jsonb
    )
  INTO v_service_count, v_duration, v_services
  FROM service
  WHERE user_id = v_master.user_id
    AND is_active = true
    AND id = ANY(p_service_ids);

  IF v_service_count <> cardinality(p_service_ids) THEN
    RAISE EXCEPTION 'services_unavailable';
  END IF;

  v_ends_at      := p_starts_at + make_interval(mins => v_duration);
  v_local_start  := p_starts_at AT TIME ZONE v_master.timezone;
  v_local_date   := v_local_start::date;
  v_local_time   := v_local_start::time;
  v_local_dow    := EXTRACT(dow FROM v_local_start)::int;

  v_day_name := CASE v_local_dow
    WHEN 0 THEN 'sunday'
    WHEN 1 THEN 'monday'
    WHEN 2 THEN 'tuesday'
    WHEN 3 THEN 'wednesday'
    WHEN 4 THEN 'thursday'
    WHEN 5 THEN 'friday'
    WHEN 6 THEN 'saturday'
  END;

  -- Check day is enabled in schedule
  v_day_enabled := (v_master.schedule->'days'->v_day_name->>'enabled')::boolean;
  IF v_day_enabled IS NOT TRUE THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  -- Check time within working hours
  v_work_start := (v_master.schedule->'days'->v_day_name->>'start')::time;
  v_work_end   := (v_master.schedule->'days'->v_day_name->>'end')::time;

  IF v_local_time < v_work_start
    OR (v_local_time + make_interval(mins => v_duration))::time > v_work_end
  THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  -- Check slot does not fall inside a break
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_master.schedule->'days'->v_day_name->'breaks') AS brk
    WHERE v_local_time < (brk->>'end')::time
      AND (v_local_time + make_interval(mins => v_duration))::time > (brk->>'start')::time
  ) THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  -- Check slot step alignment (30-minute grid from work start)
  IF mod(EXTRACT(EPOCH FROM (v_local_time - v_work_start))::int / 60, 30) <> 0 THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  -- Check no conflicting appointments
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE user_id = v_master.user_id
      AND status <> 'cancelled'
      AND start_at < v_ends_at
      AND (start_at + make_interval(mins => duration)) > p_starts_at
  ) THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  -- Check no conflicting pending/confirmed bookings (from online booking)
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE master_id = v_master.id
      AND status <> 'cancelled'
      AND starts_at < v_ends_at
      AND ends_at > p_starts_at
  ) THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  -- Check no conflicting time blocks
  IF EXISTS (
    SELECT 1 FROM time_block
    WHERE user_id = v_master.user_id
      AND start_at < v_ends_at
      AND end_at > p_starts_at
  ) THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  INSERT INTO bookings (
    master_id,
    client_phone,
    service_ids,
    starts_at,
    ends_at,
    note
  )
  VALUES (
    v_master.id,
    p_phone,
    p_service_ids,
    p_starts_at,
    v_ends_at,
    nullif(btrim(coalesce(p_note, '')), '')
  )
  RETURNING * INTO v_booking;

  RETURN jsonb_build_object(
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
END;
$$;
;
