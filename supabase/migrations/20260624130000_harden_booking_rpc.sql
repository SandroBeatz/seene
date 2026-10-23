-- Defense-in-depth: apply master_settings constraints inside the advisory lock.
-- Previously the RPC hardcoded slot_step=30 and ignored buffer_minutes; this
-- migration reads all booking params from master_settings and enforces them:
--   1. online_booking_enabled gate
--   2. booking_min_notice_minutes check
--   3. calendar_slot_step_minutes replaces the hardcoded 30-minute alignment
--   4. booking_buffer_minutes extends existing appointment/booking busy intervals

CREATE OR REPLACE FUNCTION public.create_appointment_from_booking(
  p_username text,
  p_service_ids uuid[],
  p_starts_at timestamptz,
  p_phone text,
  p_first_name text DEFAULT NULL::text,
  p_last_name text DEFAULT NULL::text,
  p_note text DEFAULT NULL::text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_master              record;
  v_settings            record;
  v_duration            int;
  v_price               numeric;
  v_service_count       int;
  v_services            jsonb;
  v_ends_at             timestamptz;
  v_local_start         timestamp;
  v_local_time          time;
  v_local_dow           int;
  v_day_name            text;
  v_work_start          time;
  v_work_end            time;
  v_day_enabled         boolean;
  v_client_id           uuid;
  v_stored_phone        text;
  v_upsert_phone        text;
  v_booking_status      text;
  v_slot_step           int;
  v_buffer_minutes      int;
  v_min_notice_minutes  int;
  v_appt                appointments%rowtype;
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

  -- Read all booking constraints from master_settings (inside the lock for consistency).
  SELECT
    coalesce(online_booking_enabled, false)                            AS online_booking_enabled,
    CASE WHEN booking_default_status = 'confirmed' THEN 'confirmed' ELSE 'pending' END
                                                                       AS booking_default_status,
    coalesce(calendar_slot_step_minutes, 15)                           AS calendar_slot_step_minutes,
    coalesce(booking_buffer_minutes, 0)                                AS booking_buffer_minutes,
    coalesce(booking_min_notice_minutes, 0)                            AS booking_min_notice_minutes
  INTO v_settings
  FROM master_settings
  WHERE user_id = v_master.user_id;

  -- Defaults when no settings row exists (master never opened dashboard settings).
  IF NOT FOUND THEN
    v_settings.online_booking_enabled    := false;
    v_settings.booking_default_status    := 'pending';
    v_settings.calendar_slot_step_minutes := 15;
    v_settings.booking_buffer_minutes    := 0;
    v_settings.booking_min_notice_minutes := 0;
  END IF;

  v_booking_status     := v_settings.booking_default_status;
  v_slot_step          := v_settings.calendar_slot_step_minutes;
  v_buffer_minutes     := v_settings.booking_buffer_minutes;
  v_min_notice_minutes := v_settings.booking_min_notice_minutes;

  IF NOT v_settings.online_booking_enabled THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  IF p_starts_at < now() + make_interval(mins => v_min_notice_minutes) THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  SELECT
    count(*),
    coalesce(sum(duration), 0)::int,
    coalesce(sum(price), 0),
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id',          id,
          'category_id', category_id,
          'name',        name,
          'description', description,
          'duration',    duration,
          'price',       price,
          'color',       color,
          'sort_order',  sort_order
        )
        ORDER BY sort_order, name
      ),
      '[]'::jsonb
    )
  INTO v_service_count, v_duration, v_price, v_services
  FROM service
  WHERE user_id = v_master.user_id
    AND is_active = true
    AND id = ANY(p_service_ids);

  IF v_service_count <> cardinality(p_service_ids) THEN
    RAISE EXCEPTION 'services_unavailable';
  END IF;

  v_ends_at     := p_starts_at + make_interval(mins => v_duration);
  v_local_start := p_starts_at AT TIME ZONE v_master.timezone;
  v_local_time  := v_local_start::time;
  v_local_dow   := EXTRACT(dow FROM v_local_start)::int;

  v_day_name := CASE v_local_dow
    WHEN 0 THEN 'sunday'
    WHEN 1 THEN 'monday'
    WHEN 2 THEN 'tuesday'
    WHEN 3 THEN 'wednesday'
    WHEN 4 THEN 'thursday'
    WHEN 5 THEN 'friday'
    WHEN 6 THEN 'saturday'
  END;

  v_day_enabled := (v_master.schedule->'days'->v_day_name->>'enabled')::boolean;
  IF v_day_enabled IS NOT TRUE THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  v_work_start := (v_master.schedule->'days'->v_day_name->>'start')::time;
  v_work_end   := (v_master.schedule->'days'->v_day_name->>'end')::time;

  IF v_local_time < v_work_start
    OR (v_local_time + make_interval(mins => v_duration))::time > v_work_end
  THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_master.schedule->'days'->v_day_name->'breaks') AS brk
    WHERE v_local_time < (brk->>'end')::time
      AND (v_local_time + make_interval(mins => v_duration))::time > (brk->>'start')::time
  ) THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  -- Slot must align to the master's configured slot step from work start.
  IF v_slot_step > 0
    AND mod(EXTRACT(EPOCH FROM (v_local_time - v_work_start))::int / 60, v_slot_step) <> 0
  THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  -- Overlap check: extend each existing appointment's end by buffer_minutes.
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE user_id = v_master.user_id
      AND status <> 'cancelled'
      AND start_at < v_ends_at
      AND (start_at + make_interval(mins => duration + v_buffer_minutes)) > p_starts_at
  ) THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  -- Overlap check: extend each existing booking's end by buffer_minutes.
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE master_id = v_master.id
      AND status <> 'cancelled'
      AND starts_at < v_ends_at
      AND (ends_at + make_interval(mins => v_buffer_minutes)) > p_starts_at
  ) THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  IF EXISTS (
    SELECT 1 FROM time_block
    WHERE user_id = v_master.user_id
      AND start_at < v_ends_at
      AND end_at > p_starts_at
  ) THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  SELECT phone INTO v_stored_phone
  FROM client
  WHERE user_id = v_master.user_id
    AND regexp_replace(phone, '[^0-9]', '', 'g') = regexp_replace(p_phone, '[^0-9]', '', 'g')
  LIMIT 1;

  v_upsert_phone := coalesce(v_stored_phone, p_phone);

  IF v_stored_phone IS NULL AND (p_first_name IS NULL OR length(btrim(p_first_name)) = 0) THEN
    RAISE EXCEPTION 'client_name_required';
  END IF;

  INSERT INTO client (user_id, phone, first_name, last_name, source)
  VALUES (
    v_master.user_id,
    v_upsert_phone,
    coalesce(p_first_name, ''),
    p_last_name,
    'online_booking'
  )
  ON CONFLICT (user_id, phone) DO UPDATE
    SET first_name = CASE WHEN client.first_name = '' THEN EXCLUDED.first_name ELSE client.first_name END,
        last_name  = CASE WHEN client.last_name IS NULL THEN EXCLUDED.last_name ELSE client.last_name END
  RETURNING id INTO v_client_id;

  INSERT INTO appointments (
    user_id, client_id, service_ids, start_at, duration, price, status, notes, source
  )
  VALUES (
    v_master.user_id,
    v_client_id,
    p_service_ids,
    p_starts_at,
    v_duration,
    v_price,
    v_booking_status,
    nullif(btrim(coalesce(p_note, '')), ''),
    'online_booking'
  )
  RETURNING * INTO v_appt;

  RETURN jsonb_build_object(
    'booking', jsonb_build_object(
      'id',        v_appt.id,
      'starts_at', v_appt.start_at,
      'ends_at',   v_appt.start_at + make_interval(mins => v_appt.duration),
      'services',  v_services,
      'master',    jsonb_build_object(
        'first_name', v_master.first_name,
        'last_name',  v_master.last_name
      )
    )
  );
END;
$function$;
