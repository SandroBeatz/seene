-- The master's feed (design AppNotifs). Rows are written only by the database. What the visit was
-- is kept in `payload`, so the card still reads right after the visit changes or goes; the app
-- builds the words, in its own language and the master's time zone.
-- This stage: what a client does online. Scheduled kinds come with their jobs.
CREATE TABLE public.notification (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  kind           text NOT NULL CONSTRAINT notification_kind CHECK (
    kind IN ('booking_new', 'booking_cancelled', 'booking_moved')
  ),
  appointment_id uuid REFERENCES public.appointments (id) ON DELETE SET NULL,
  client_id      uuid REFERENCES public.client (id) ON DELETE SET NULL,
  payload        jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at        timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notification_user_created_idx
  ON public.notification (user_id, created_at DESC);
CREATE INDEX notification_appointment_idx ON public.notification (appointment_id);
CREATE INDEX notification_client_idx ON public.notification (client_id);

ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_select ON public.notification
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));
CREATE POLICY notification_update ON public.notification
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY notification_delete ON public.notification
  FOR DELETE TO authenticated USING (user_id = (select auth.uid()));

CREATE FUNCTION public.notify_visit(p_kind text, p_visit public.appointments, p_extra jsonb)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_name     text;
  v_services text[];
  v_total    numeric;
BEGIN
  SELECT trim(concat_ws(' ', first_name, last_name)) INTO v_name
    FROM client WHERE id = p_visit.client_id;

  SELECT array_agg(s.name ORDER BY picked.position), COALESCE(sum(s.price), 0)
    INTO v_services, v_total
    FROM unnest(p_visit.service_ids) WITH ORDINALITY AS picked(id, position)
    JOIN service s ON s.id = picked.id;

  INSERT INTO notification (user_id, kind, appointment_id, client_id, payload)
  VALUES (
    p_visit.user_id,
    p_kind,
    p_visit.id,
    p_visit.client_id,
    jsonb_build_object(
      'client_name', v_name,
      'start_at', p_visit.start_at,
      'services', COALESCE(to_jsonb(v_services), '[]'::jsonb),
      'price', COALESCE(p_visit.price, v_total)
    ) || p_extra
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_visit(text, public.appointments, jsonb)
  FROM PUBLIC, anon, authenticated;

-- A notification must never cost a client their booking: failures only warn.
CREATE FUNCTION public.notify_online_booking()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_from timestamptz;
BEGIN
  BEGIN
    IF NEW.rescheduled_from IS NOT NULL THEN
      SELECT start_at INTO v_from FROM appointments WHERE id = NEW.rescheduled_from;
      PERFORM notify_visit('booking_moved', NEW, jsonb_build_object('from_start_at', v_from));
    ELSE
      PERFORM notify_visit('booking_new', NEW, '{}'::jsonb);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_online_booking: visit % failed: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$function$;

CREATE FUNCTION public.notify_client_cancelled()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    -- A reschedule cancels the old booking after making the new one: that is one "moved".
    IF NOT EXISTS (SELECT 1 FROM appointments WHERE rescheduled_from = NEW.id) THEN
      PERFORM notify_visit('booking_cancelled', NEW, '{}'::jsonb);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_client_cancelled: visit % failed: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_online_booking() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_client_cancelled() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER appointments_notify_online_booking
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  WHEN (NEW.source = 'online_booking')
  EXECUTE FUNCTION public.notify_online_booking();

CREATE TRIGGER appointments_notify_client_cancelled
  AFTER UPDATE OF status ON public.appointments
  FOR EACH ROW
  WHEN (
    NEW.status = 'cancelled'
    AND OLD.status IS DISTINCT FROM 'cancelled'
    AND NEW.cancelled_by = 'client'
  )
  EXECUTE FUNCTION public.notify_client_cancelled();
