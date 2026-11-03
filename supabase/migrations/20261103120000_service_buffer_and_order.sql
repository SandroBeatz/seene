-- "Услуги и цены" (mobile menu, phase 3).
--
-- Перерыв после услуги: the time after a visit that stays closed for the next one. It is
-- copied to the appointment like its duration, so editing a service later doesn't move
-- bookings already made. A visit of several services takes the longest one. The gap
-- between two visits is the larger of this and booking_buffer_minutes.

ALTER TABLE public.service
  ADD COLUMN buffer_after_minutes integer NOT NULL DEFAULT 0
  CONSTRAINT service_buffer_after_range CHECK (buffer_after_minutes BETWEEN 0 AND 240);

ALTER TABLE public.appointments
  ADD COLUMN buffer_after_minutes integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.set_appointment_buffer()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.buffer_after_minutes := coalesce(
    (SELECT max(buffer_after_minutes) FROM service WHERE id = ANY (NEW.service_ids)),
    0
  );
  RETURN NEW;
END;
$$;

-- Every way of writing a visit goes through this: the app inserts directly.
CREATE TRIGGER appointments_set_buffer
  BEFORE INSERT OR UPDATE OF service_ids ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_appointment_buffer();

-- The direction a category belongs to, so an empty one keeps its place. NULL = offered
-- under every direction: categories from onboarding are shared by name.
ALTER TABLE public.service_category
  ADD COLUMN specialization text
  CONSTRAINT service_category_specialization_valid
  CHECK (specialization IS NULL OR specialization = ANY (public.specialization_keys()));

UPDATE public.service_category c
SET specialization = s.specialization
FROM (
  SELECT category_id, min(specialization) AS specialization
  FROM public.service
  WHERE category_id IS NOT NULL
  GROUP BY category_id
  HAVING count(DISTINCT specialization) = 1 AND count(specialization) = count(*)
) s
WHERE c.id = s.category_id;

-- Dragging writes the whole group's order at once. Invoker rights: RLS keeps it to the
-- master's own rows.
CREATE OR REPLACE FUNCTION public.reorder_services(p_ids uuid[])
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE service s
  SET sort_order = o.position
  FROM unnest(p_ids) WITH ORDINALITY AS o(id, position)
  WHERE s.id = o.id;
$$;

CREATE OR REPLACE FUNCTION public.reorder_service_categories(p_ids uuid[])
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE service_category c
  SET sort_order = o.position
  FROM unnest(p_ids) WITH ORDINALITY AS o(id, position)
  WHERE c.id = o.id;
$$;

REVOKE ALL ON FUNCTION public.reorder_services(uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reorder_service_categories(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reorder_services(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_service_categories(uuid[]) TO authenticated;

-- Online booking: same function, with the buffers in its two overlap checks.
CREATE OR REPLACE FUNCTION public.create_appointment_from_booking(
  p_username          text,
  p_service_ids       uuid[],
  p_starts_at         timestamptz,
  p_phone             text,
  p_first_name        text DEFAULT NULL::text,
  p_last_name         text DEFAULT NULL::text,
  p_note              text DEFAULT NULL::text,
  p_holder_hash       text DEFAULT NULL::text,
  p_reminders_consent boolean DEFAULT NULL,
  p_marketing_consent boolean DEFAULT NULL,
  p_future_limit      int DEFAULT 2,
  p_link_hash         text DEFAULT NULL::text,
  p_replaces_hash     text DEFAULT NULL::text
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
  v_own_buffer          int;
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
  v_client              record;
  v_client_id           uuid;
  v_upsert_phone        text;
  v_booking_status      text;
  v_slot_step           int;
  v_buffer_minutes      int;
  v_min_notice_minutes  int;
  v_old                 appointments%rowtype;
  v_old_id              uuid;
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

  SELECT
    coalesce(online_booking_enabled, false)                            AS online_booking_enabled,
    CASE WHEN booking_default_status = 'confirmed' THEN 'confirmed' ELSE 'pending' END
                                                                       AS booking_default_status,
    coalesce(calendar_slot_step_minutes, 15)                           AS calendar_slot_step_minutes,
    coalesce(booking_buffer_minutes, 0)                                AS booking_buffer_minutes,
    coalesce(booking_min_notice_minutes, 0)                            AS booking_min_notice_minutes,
    coalesce(cancel_window_hours, 12)                                  AS cancel_window_hours
  INTO v_settings
  FROM master_settings
  WHERE user_id = v_master.user_id;

  IF NOT FOUND THEN
    v_settings.online_booking_enabled    := false;
    v_settings.booking_default_status    := 'pending';
    v_settings.calendar_slot_step_minutes := 15;
    v_settings.booking_buffer_minutes    := 0;
    v_settings.booking_min_notice_minutes := 0;
    v_settings.cancel_window_hours       := 12;
  END IF;

  v_booking_status     := v_settings.booking_default_status;
  v_slot_step          := v_settings.calendar_slot_step_minutes;
  v_buffer_minutes     := v_settings.booking_buffer_minutes;
  v_min_notice_minutes := v_settings.booking_min_notice_minutes;

  IF NOT v_settings.online_booking_enabled THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  SELECT
    count(*),
    coalesce(sum(duration), 0)::int,
    coalesce(max(buffer_after_minutes), 0)::int,
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
  INTO v_service_count, v_duration, v_own_buffer, v_price, v_services
  FROM service
  WHERE user_id = v_master.user_id
    AND is_active = true
    AND show_online = true
    AND id = ANY(p_service_ids);

  IF v_service_count <> cardinality(p_service_ids) THEN
    RAISE EXCEPTION 'services_unavailable';
  END IF;

  -- Phones are canonical digits (client_phone_canonical).
  SELECT id, phone, blocked INTO v_client
  FROM client
  WHERE user_id = v_master.user_id
    AND phone = p_phone
  LIMIT 1;

  -- Blacklisted: refused without saying why.
  IF v_client.blocked IS TRUE THEN
    RAISE EXCEPTION 'booking_refused';
  END IF;

  -- A second tap on "Book" (or a retried request) returns the booking the
  -- first one made instead of failing on its own slot. A fresh link is saved
  -- for it, so the token in this response works too.
  IF v_client.id IS NOT NULL THEN
    SELECT * INTO v_appt
    FROM appointments
    WHERE user_id = v_master.user_id
      AND client_id = v_client.id
      AND start_at = p_starts_at
      AND service_ids = p_service_ids
      AND source = 'online_booking'
      AND status <> 'cancelled'
      AND created_at > now() - interval '10 minutes'
    LIMIT 1;

    IF FOUND THEN
      IF p_link_hash IS NOT NULL THEN
        INSERT INTO booking_link (appointment_id, token_hash, expires_at)
        VALUES (v_appt.id, p_link_hash, v_appt.start_at + interval '24 hours');
      END IF;

      RETURN jsonb_build_object(
        'created', false,
        'booking', jsonb_build_object(
          'id',        v_appt.id,
          'starts_at', v_appt.start_at,
          'ends_at',   v_appt.start_at + make_interval(mins => v_appt.duration),
          'status',    v_appt.status,
          'services',  v_services,
          'master',    jsonb_build_object(
            'first_name', v_master.first_name,
            'last_name',  v_master.last_name
          )
        )
      );
    END IF;
  END IF;

  -- Reschedule: the old booking must be hers, with this master, and still
  -- cancellable by link.
  IF p_replaces_hash IS NOT NULL THEN
    SELECT a.* INTO v_old
    FROM booking_link l
    JOIN appointments a ON a.id = l.appointment_id
    WHERE l.token_hash = p_replaces_hash
      AND l.expires_at > now()
      AND a.user_id = v_master.user_id
      AND a.client_id = v_client.id
      AND a.status IN ('pending', 'confirmed')
      AND now() <= a.start_at - make_interval(hours => v_settings.cancel_window_hours)
    FOR UPDATE OF a;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'reschedule_unavailable';
    END IF;

    v_old_id := v_old.id;
  END IF;

  -- The booking being replaced does not count towards the limit.
  IF v_client.id IS NOT NULL AND (
    SELECT count(*)
    FROM appointments
    WHERE user_id = v_master.user_id
      AND client_id = v_client.id
      AND source = 'online_booking'
      AND status IN ('pending', 'confirmed')
      AND start_at > now()
      AND id IS DISTINCT FROM v_old_id
  ) >= p_future_limit THEN
    RAISE EXCEPTION 'booking_limit';
  END IF;

  IF p_starts_at < now() + make_interval(mins => v_min_notice_minutes) THEN
    RAISE EXCEPTION 'slot_unavailable';
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

  IF v_slot_step > 0
    AND mod(EXTRACT(EPOCH FROM (v_local_time - v_work_start))::int / 60, v_slot_step) <> 0
  THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE user_id = v_master.user_id
      AND status <> 'cancelled'
      AND id IS DISTINCT FROM v_old_id
      AND start_at < v_ends_at + make_interval(mins => v_own_buffer)
      AND (start_at + make_interval(mins => duration + greatest(v_buffer_minutes, buffer_after_minutes))) > p_starts_at
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

  -- Someone else is on the details step with an overlapping slot.
  IF EXISTS (
    SELECT 1 FROM slot_hold
    WHERE master_user_id = v_master.user_id
      AND expires_at > now()
      AND holder_hash IS DISTINCT FROM p_holder_hash
      AND start_at < v_ends_at + make_interval(mins => greatest(v_buffer_minutes, v_own_buffer))
      AND (end_at + make_interval(mins => v_buffer_minutes)) > p_starts_at
  ) THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  v_upsert_phone := coalesce(v_client.phone, p_phone);

  IF v_client.id IS NULL AND (p_first_name IS NULL OR length(btrim(p_first_name)) = 0) THEN
    RAISE EXCEPTION 'client_name_required';
  END IF;

  INSERT INTO client (
    user_id, phone, first_name, last_name, source, reminders_consent, marketing_consent
  )
  VALUES (
    v_master.user_id,
    v_upsert_phone,
    coalesce(p_first_name, ''),
    p_last_name,
    'online_booking',
    coalesce(p_reminders_consent, false),
    coalesce(p_marketing_consent, false)
  )
  ON CONFLICT (user_id, phone) DO UPDATE
    SET first_name = CASE WHEN client.first_name = '' THEN EXCLUDED.first_name ELSE client.first_name END,
        last_name  = CASE WHEN client.last_name IS NULL THEN EXCLUDED.last_name ELSE client.last_name END,
        -- The latest choice on the form wins; NULL means "not asked".
        reminders_consent = coalesce(p_reminders_consent, client.reminders_consent),
        marketing_consent = coalesce(p_marketing_consent, client.marketing_consent)
  RETURNING id INTO v_client_id;

  INSERT INTO appointments (
    user_id, client_id, service_ids, start_at, duration, price, status, notes, source,
    rescheduled_from
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
    'online_booking',
    v_old_id
  )
  RETURNING * INTO v_appt;

  -- The old booking goes only now, after the new one exists.
  IF v_old_id IS NOT NULL THEN
    UPDATE appointments
    SET status       = 'cancelled',
        cancelled_at = now(),
        cancelled_by = 'client'
    WHERE id = v_old_id;
  END IF;

  IF p_link_hash IS NOT NULL THEN
    INSERT INTO booking_link (appointment_id, token_hash, expires_at)
    VALUES (v_appt.id, p_link_hash, v_appt.start_at + interval '24 hours');
  END IF;

  IF p_holder_hash IS NOT NULL THEN
    DELETE FROM slot_hold
    WHERE master_user_id = v_master.user_id AND holder_hash = p_holder_hash;
  END IF;

  RETURN jsonb_build_object(
    'created', true,
    'booking', jsonb_build_object(
      'id',        v_appt.id,
      'starts_at', v_appt.start_at,
      'ends_at',   v_appt.start_at + make_interval(mins => v_appt.duration),
      'status',    v_appt.status,
      'services',  v_services,
      'master',    jsonb_build_object(
        'first_name', v_master.first_name,
        'last_name',  v_master.last_name
      )
    )
  );
END;
$function$
