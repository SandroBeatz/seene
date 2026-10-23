-- Phase 4 of the master page plan: cancel and reschedule by a personal link.
--
-- 1. booking_link: the client gets a link /c/<token> in the confirmation and
--    the reminder. The token is random (256 bits); only its SHA-256 hash is
--    stored. A link opens one appointment and works until the visit + 24 h.
--    One appointment may have several links (confirmation, reminder, a
--    repeated tap), each valid on its own.
-- 2. appointments: who cancelled and why, and which appointment a rescheduled
--    one replaces. All new columns are nullable, so the master app keeps
--    working unchanged.
-- 3. cancel_appointment_by_link: cancels while the master's cancel window is
--    open (master_settings.cancel_window_hours, 12 by default).
-- 4. create_appointment_from_booking: saves the new link and, for a
--    reschedule, cancels the old appointment in the same transaction, only
--    after the new one is created.

CREATE TABLE IF NOT EXISTS public.booking_link (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments (id) ON DELETE CASCADE,
  token_hash     text NOT NULL UNIQUE,
  expires_at     timestamptz NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_link_appointment_idx
  ON public.booking_link (appointment_id);

-- Server-only table (service role); no policies on purpose.
ALTER TABLE public.booking_link ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.booking_link FROM anon, authenticated;
COMMENT ON TABLE public.booking_link IS
  'RLS enabled, intentionally no policies -- accessed only via service_role from seene server routes.';

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by text
    CHECK (cancelled_by IN ('client', 'master')),
  ADD COLUMN IF NOT EXISTS cancel_reason text
    CHECK (char_length(cancel_reason) <= 200),
  ADD COLUMN IF NOT EXISTS rescheduled_from uuid
    REFERENCES public.appointments (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.appointments.cancelled_by IS
  'Who cancelled: client (by link) or master. NULL for rows cancelled before this column existed.';
COMMENT ON COLUMN public.appointments.rescheduled_from IS
  'The appointment this one replaced when the client moved her booking by link.';

-- Cancels the appointment behind a link. Raises:
--   link_not_found        no such link, or it has expired
--   cancel_window_closed  less than cancel_window_hours before the visit
--   not_cancellable       completed, no-show or expired
-- An appointment that is already cancelled is returned as is.
CREATE OR REPLACE FUNCTION public.cancel_appointment_by_link(
  p_token_hash text,
  p_reason     text DEFAULT NULL
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_appointment_id uuid;
  v_master_id      uuid;
  v_window_hours   int;
  v_appt           appointments%rowtype;
BEGIN
  SELECT l.appointment_id, m.id
  INTO v_appointment_id, v_master_id
  FROM booking_link l
  JOIN appointments a ON a.id = l.appointment_id
  JOIN master_profile m ON m.user_id = a.user_id
  WHERE l.token_hash = p_token_hash
    AND l.expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'link_not_found';
  END IF;

  -- The same per-master lock as booking, so a cancel and a booking of the
  -- freed slot do not race.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_master_id::text, 0));

  SELECT * INTO v_appt FROM appointments WHERE id = v_appointment_id FOR UPDATE;

  IF v_appt.status = 'cancelled' THEN
    RETURN jsonb_build_object('id', v_appt.id, 'status', v_appt.status);
  END IF;

  IF v_appt.status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'not_cancellable';
  END IF;

  SELECT cancel_window_hours INTO v_window_hours
  FROM master_settings WHERE user_id = v_appt.user_id;
  v_window_hours := coalesce(v_window_hours, 12);

  IF now() > v_appt.start_at - make_interval(hours => v_window_hours) THEN
    RAISE EXCEPTION 'cancel_window_closed';
  END IF;

  UPDATE appointments
  SET status        = 'cancelled',
      cancelled_at  = now(),
      cancelled_by  = 'client',
      cancel_reason = left(nullif(btrim(coalesce(p_reason, '')), ''), 200)
  WHERE id = v_appt.id
  RETURNING * INTO v_appt;

  RETURN jsonb_build_object('id', v_appt.id, 'status', v_appt.status);
END;
$function$;

REVOKE ALL ON FUNCTION public.cancel_appointment_by_link(text, text)
  FROM PUBLIC, anon, authenticated;

-- The signature changes, so drop the old one instead of adding an overload.
DROP FUNCTION IF EXISTS public.create_appointment_from_booking(
  text, uuid[], timestamptz, text, text, text, text, text, boolean, boolean, int
);

-- New parameters:
--   p_link_hash      hash of the link token for this booking (saved with it)
--   p_replaces_hash  hash of the old booking's link: a reschedule. The old
--                    appointment must belong to the same phone and master and
--                    still be cancellable; it is cancelled after the new one
--                    is created. Raises reschedule_unavailable otherwise.
-- The result gains `created`: false when a repeated tap returned the booking
-- made by the first one (the server then does not send the confirmation
-- again).
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
      AND start_at < v_ends_at
      AND (start_at + make_interval(mins => duration + v_buffer_minutes)) > p_starts_at
  ) THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

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

  -- Someone else is on the details step with an overlapping slot.
  IF EXISTS (
    SELECT 1 FROM slot_hold
    WHERE master_user_id = v_master.user_id
      AND expires_at > now()
      AND holder_hash IS DISTINCT FROM p_holder_hash
      AND start_at < v_ends_at + make_interval(mins => v_buffer_minutes)
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
$function$;

REVOKE ALL ON FUNCTION public.create_appointment_from_booking(
  text, uuid[], timestamptz, text, text, text, text, text, boolean, boolean, int, text, text
) FROM PUBLIC, anon, authenticated;
