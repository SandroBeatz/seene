-- The master's own writes take the same per-master lock as online booking.
--
-- create_appointment_from_booking, hold_booking_slot and cancel_appointment_by_link
-- serialise on pg_advisory_xact_lock(hashtextextended(master_profile.id::text, 0)),
-- then check free time and write. The master app inserts and moves visits and
-- personal time straight into the tables, without that lock: an online booking
-- could check "free", the master's visit land in the same instant, and the booking
-- be written on top of it.
--
-- These triggers take the lock before any write that adds or moves busy time, so
-- whichever comes second sees the first. The master may still overlap visits on
-- purpose (the app only warns); the lock only removes the race.
-- Advisory xact locks are re-entrant, so the booking RPCs' own inserts are fine.

CREATE OR REPLACE FUNCTION public.take_master_booking_lock()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
AS $function$
DECLARE
  v_master_id uuid;
BEGIN
  SELECT id INTO v_master_id FROM public.master_profile WHERE user_id = NEW.user_id;

  IF v_master_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(v_master_id::text, 0));
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.take_master_booking_lock() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER appointments_booking_lock
  BEFORE INSERT OR UPDATE OF start_at, duration, service_ids, status, user_id ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.take_master_booking_lock();

CREATE TRIGGER time_block_booking_lock
  BEFORE INSERT OR UPDATE OF start_at, end_at, kind, user_id ON public.time_block
  FOR EACH ROW EXECUTE FUNCTION public.take_master_booking_lock();
