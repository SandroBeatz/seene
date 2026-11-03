-- Follow-up to service_buffer_and_order.
--
-- 1. The app sends service_ids with every edit of a visit's services, price or duration.
--    A visit keeps its break unless its services really change, so editing a service later
--    doesn't move bookings already made.
-- 2. hold_booking_slot counts the break of booked visits, as create_appointment_from_booking
--    does, and holds the new visit's own break (p_after_minutes). That break keeps other
--    clients away but may touch personal time, so time blocks are checked without it.

CREATE OR REPLACE FUNCTION public.set_appointment_buffer()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.service_ids IS NOT DISTINCT FROM OLD.service_ids THEN
    RETURN NEW;
  END IF;
  NEW.buffer_after_minutes := coalesce(
    (SELECT max(buffer_after_minutes) FROM service WHERE id = ANY (NEW.service_ids)),
    0
  );
  RETURN NEW;
END;
$$;

DROP FUNCTION public.hold_booking_slot(text, text, timestamptz, int, int);

CREATE FUNCTION public.hold_booking_slot(
  p_username      text,
  p_holder_hash   text,
  p_starts_at     timestamptz,
  p_duration      int,
  p_ttl_minutes   int DEFAULT 10,
  p_after_minutes int DEFAULT 0
)
 RETURNS timestamptz
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_master  record;
  v_buffer  int;
  v_ends_at timestamptz;
  v_held_to timestamptz;
  v_expires timestamptz;
BEGIN
  IF p_holder_hash IS NULL OR p_starts_at IS NULL OR coalesce(p_duration, 0) <= 0 THEN
    RAISE EXCEPTION 'hold_invalid';
  END IF;

  SELECT id, user_id INTO v_master FROM master_profile WHERE username = p_username;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'master_not_found';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_master.id::text, 0));

  SELECT coalesce(booking_buffer_minutes, 0) INTO v_buffer
  FROM master_settings WHERE user_id = v_master.user_id;
  v_buffer := coalesce(v_buffer, 0);

  v_ends_at := p_starts_at + make_interval(mins => p_duration);
  v_held_to := v_ends_at + make_interval(mins => greatest(coalesce(p_after_minutes, 0), 0));
  v_expires := now() + make_interval(mins => p_ttl_minutes);

  DELETE FROM slot_hold WHERE master_user_id = v_master.user_id AND expires_at <= now();

  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE user_id = v_master.user_id
      AND status <> 'cancelled'
      AND start_at < v_held_to + make_interval(mins => v_buffer)
      AND (start_at + make_interval(mins => duration + greatest(v_buffer, buffer_after_minutes))) > p_starts_at
  ) OR EXISTS (
    SELECT 1 FROM time_block
    WHERE user_id = v_master.user_id
      AND start_at < v_ends_at
      AND end_at > p_starts_at
  ) OR EXISTS (
    SELECT 1 FROM slot_hold
    WHERE master_user_id = v_master.user_id
      AND holder_hash <> p_holder_hash
      AND start_at < v_held_to + make_interval(mins => v_buffer)
      AND (end_at + make_interval(mins => v_buffer)) > p_starts_at
  ) THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  INSERT INTO slot_hold (master_user_id, holder_hash, start_at, end_at, expires_at)
  VALUES (v_master.user_id, p_holder_hash, p_starts_at, v_held_to, v_expires)
  ON CONFLICT (master_user_id, holder_hash) DO UPDATE
    SET start_at = EXCLUDED.start_at,
        end_at = EXCLUDED.end_at,
        expires_at = EXCLUDED.expires_at,
        created_at = now();

  RETURN v_expires;
END;
$function$;

REVOKE ALL ON FUNCTION public.hold_booking_slot(text, text, timestamptz, int, int, int)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hold_booking_slot(text, text, timestamptz, int, int, int)
  TO service_role;
